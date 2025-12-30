import { NgIf } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { LogoType } from 'src/app/enums';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class LogoComponent implements OnInit, OnChanges {
  @Input() type?: LogoType;
  leftLogoText: string = '';
  rightLogoText: string = '';
  LogoType = LogoType;

  constructor() {
    window.addEventListener('resize', () => {
      this.setLogoText();
    });
  }

  ngOnInit(): void {
    this.setLogoText();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['type']) {
      this.setLogoText();
    }
  }

  private setLogoText(): void {
    this.leftLogoText = '';
    this.rightLogoText = '';

    if (this.type === LogoType.Copyright) {
      this.leftLogoText = '© 2025';
      this.rightLogoText = 'z-control';
    } else {
      // show company only on landscape mode
      this.rightLogoText = this.isPortrait ? '' : 'z-control';
    }
  }

  private get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }
}
