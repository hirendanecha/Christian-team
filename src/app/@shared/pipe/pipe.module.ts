import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SafePipe } from "./safe.pipe";
import { GetImageUrlPipe } from "./get-image-url.pipe";
import { CommaSeperatePipe } from './comma-seperate.pipe';
import { DateDayPipe } from "../services/date-day.pipe";
import { NoSanitizePipe } from "./sanitize.pipe";
import { MessageDatePipe } from "./message-date.pipe";
import { MessageTimePipe } from "./message-time.pipe";
import { HighlightPipe } from "./hightlight-text.pipe";

@NgModule({
  declarations: [SafePipe, GetImageUrlPipe, CommaSeperatePipe, DateDayPipe, NoSanitizePipe, MessageDatePipe, MessageTimePipe, HighlightPipe],
  imports: [CommonModule],
  exports: [SafePipe, GetImageUrlPipe, CommaSeperatePipe, DateDayPipe, NoSanitizePipe, MessageDatePipe, MessageTimePipe, HighlightPipe],
})
export class PipeModule { }
