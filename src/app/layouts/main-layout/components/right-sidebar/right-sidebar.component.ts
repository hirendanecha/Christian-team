import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../../../../@shared/services/customer.service';
import { CommunityService } from '../../../../@shared/services/community.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { UserRewardDetailsService } from 'src/app/@shared/services/user-reward-details.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { SharedService } from 'src/app/@shared/services/shared.service';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
})
export class RightSidebarComponent implements OnInit {
  user: any;
  communities = [];
  isCommunitiesLoader: boolean = false;
  counts: any = {};
  isSettingMenuCollapse = false;

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private communityService: CommunityService,
    private customerService: CustomerService,
    private activeOffcanvas: NgbActiveOffcanvas,
    public breakpointService: BreakpointService,
    private userRewardDetailsService: UserRewardDetailsService,
    public tokenService: TokenStorageService,
    private sharedService: SharedService
  ) {
    // this.breakpointService.screen.subscribe((res) => {
    //   if (res.xl.gatherThen) {
    //     this.getCommunityList();
    //   } else {
    //     this.isCommunitiesLoader = false;
    //   }
    // });
    if (this.tokenService.getToken()) {
      this.getCommunityList();
      this.getCountByProfileId();
    }
  }

  ngOnInit(): void {
    this.customerService.customerObs.subscribe((res: any) => {
      this.user = res;
    });
  }

  getCountByProfileId(): void {
    const profileId = localStorage.getItem('profileId');
    this.userRewardDetailsService
      .getCountByProfileId(+profileId)
      .subscribe((res: any) => {
        if (res?.data) {
          this.counts = res?.data || {};
        }
      });
  }

  getCommunityList(): void {
    const profileId = +localStorage.getItem('profileId');
    this.isCommunitiesLoader = true;
    this.communityService.getLocalCommunities(profileId).subscribe({
      next: (res: any) => {
        if (res) {
          this.communities = res;
        }
      },
      error: (error) => {
        console.log(error);
        if (error.status === 401) {
          this.sharedService.logOut();
        }
      },
      complete: () => {
        this.isCommunitiesLoader = false;
      },
    });
  }

  goToCommunityDetails(community: any): void {
    this.closeSidebar();
    this.router.navigate([`my-church/details/${community?.slug}`]);
  }

  closeSidebar(): void {
    this.activeOffcanvas.dismiss('close');
  }
}
