import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-appointment-call-model',
  templateUrl: './appointment-call-model.component.html',
  styleUrls: ['./appointment-call-model.component.scss'],
})
export class AppointmentCallModelComponent implements OnInit {
  appointmentCall: SafeResourceUrl;
  domain: string = 'meet.facetime.tube';
  options: any;
  api: any;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private router: Router) { }
  ngOnInit(): void {
    const appointmentURLCall = this.route.snapshot['_routerState'].url.split('/call/')[1];
    console.log(appointmentURLCall);
    this.appointmentCall = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://meet.facetime.tube/' + appointmentURLCall
  );
    this.options = {
      roomName: appointmentURLCall,
      parentNode: document.querySelector('#meet'),
      configOverwrite: {
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        filmStripOnly: false,
        SHOW_JITSI_WATERMARK: false,
      },
      disableModeratorIndicator: true,
      lang: 'en',
    };

    const api = new JitsiMeetExternalAPI(this.domain, this.options);
    api.on('readyToClose', () => {
      this.router.navigate(['/home']).then(() => {
      });
    });
  }
}
