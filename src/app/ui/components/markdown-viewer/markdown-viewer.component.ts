import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    MarkdownComponent,
    IonSpinner,
    NgIf,
  ],
  providers: [ModalController],
})
export class MarkdownViewerComponent implements OnInit {
  @Input() fullChangeLogPath!: string;
  @ViewChild('content', { static: false }) content!: IonContent;

  markdown: string = '';
  showSpinner: boolean = true;

  constructor(
    private readonly http: HttpClient,
    private readonly modalController: ModalController,
    public readonly utilsService: UtilsService
  ) {}

  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  ngOnInit() {
    this.loadMarkdownChangelog();
  }

  closeModal() {
    this.modalController.dismiss();
  }

  scrollToTop() {
    this.content.scrollToTop(300);
  }

  private loadMarkdownChangelog() {
    this.http.get(this.fullChangeLogPath, { responseType: 'text' }).subscribe({
      next: (data) => {
        this.markdown = data;
        this.showSpinner = false;
      },
      error: (error) => {
        console.error('Error loading changelog:', error);
        this.showSpinner = false;
      },
    });
  }
}
