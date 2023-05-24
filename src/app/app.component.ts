import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { WebGLPreview } from 'gcode-preview';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import * as THREE from 'three';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  chunkSize = 250;
  file: any;
  preview: any;
  private context!: HTMLCanvasElement;
  @ViewChild('myCanvas', { static: false }) canvas!: ElementRef;

  ngAfterViewInit(): any {
    this.context = (this.canvas.nativeElement as HTMLCanvasElement);

    this.preview = new WebGLPreview({
      canvas: this.context,
      targetId: 'gcode-preview',
      topLayerColor: new THREE.Color('lime').getHex(),
      lastSegmentColor: new THREE.Color('red').getHex(),
      buildVolume: { x: 450, y: 410, z: 350, r: 100, i: 100, j: 100 },
      initialCameraPosition: [0, 400, 450]
    });

    this.preview.render();
  }

  dropped(files: any): any {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile && droppedFile.relativePath !== undefined) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry; // cast droppedFile to FileEntry
        fileEntry.file(async (file: File) => {
          const url = window.URL.createObjectURL(file); // createUrl To The FileEntry
          const linesList = await this.fetchGcode(url); // get List Of Line of the current File
          this.loadPreviewChunked(this.preview, linesList, 50); // Load Preview
        });
      }
    }
  }

  async fetchGcode(url: any): Promise<any> {
    const response = await fetch(url);

    if (response.status !== 200) {
      throw new Error(`status code: ${response.status}`);
    }
    const file = await response.text();
    return file.split('\n');
  }


  loadPreviewChunked(target: any, lines: any, delay: any): any {
    let c = 0;
    const id = '__animationTimer__' + Math.random().toString(36).substring(2, 9);

    console.log('id', id);
    console.log(typeof id);
    const loadProgressive = () => {
      const start = c * this.chunkSize;
      const end = (c + 1) * this.chunkSize;
      const chunk = lines.slice(start, end);
      target.processGCode(chunk);
      c++;
      if (c * this.chunkSize < lines.length) {
        // window[id] = setTimeout(loadProgressive, delay);
        setTimeout(loadProgressive, delay);
      }
      else {
        console.log('this file was complete');
      }
    };


    // window.clearTimeout(window[id]);
    clearTimeout(setTimeout(loadProgressive, delay));
    loadProgressive();
  }
}