import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private printInstructionsModalOpen = new BehaviorSubject<boolean>(false);
  public printInstructionsModalOpen$ = this.printInstructionsModalOpen.asObservable();

  openPrintInstructionsModal(): void {
    this.printInstructionsModalOpen.next(true);
  }

  closePrintInstructionsModal(): void {
    this.printInstructionsModalOpen.next(false);
  }
}
