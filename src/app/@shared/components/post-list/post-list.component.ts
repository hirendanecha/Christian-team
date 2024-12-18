import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { slideUp } from 'src/app/@shared/animations/slideUp';
import { PostService } from 'src/app/@shared/services/post.service';
import { SeeFirstUserService } from 'src/app/@shared/services/see-first-user.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { UnsubscribeProfileService } from '../../services/unsubscribe-profile.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss'],
  animations: [slideUp],
})
export class PostListComponent implements OnInit, OnChanges, AfterViewInit {
  @Input('parentComponent') parentComponent: string = '';
  // @Input('id') userId: number = null;
  @Input('searchText') searchText: string = null;
  @Input('communityId') communityId: number = null;
  @Output('onEditPost') onEditPost: EventEmitter<any> = new EventEmitter<any>();

  postList = [];
  isPostLoader: boolean = false;
  seeFirstList = [];
  profileId: string = '';
  activePage = 0;
  editPostIndex: number = null;
  isLoading = false;
  hasMoreData = false;
  userId: number = null;
  unSubscribeProfileIds: any = [];

  advertisementDataList: any[] = [];

  constructor(
    private spinner: NgxSpinnerService,
    private postService: PostService,
    public sharedService: SharedService,
    private socketService: SocketService,
    private seeFirstUserService: SeeFirstUserService,
    private route: ActivatedRoute,
    private unsubscribeProfileService: UnsubscribeProfileService,
    private router: Router
  ) {
    this.router.events.subscribe((event: any) => {
      if (event?.routerEvent?.url.includes('/settings/view-profile')) {
        const id = event?.routerEvent?.url.split('/')[3];
        this.userId = id;
        if (id) {
          this.getPostList();
        }
      }
    });
    this.userId = this.route.snapshot.params.id;
    this.profileId = localStorage.getItem('profileId');
    this.getUnsubscribeProfiles();
  }

  ngAfterViewInit(): void {
    if (!this.socketService.socket?.connected) {
      this.socketService.socket?.connect();
    }

    this.socketService.socket?.on(
      'new-post-added',
      (res: any) => {
        if (res[0]) {
          if (
            ((this.communityId === null && res[0].communityId === null) ||
              this.communityId === res[0].communityId) &&
            !this.userId
          ) {
            if (!this.unSubscribeProfileIds.includes(res[0]?.profileid)) {
              if (this.editPostIndex >= 0 && this.editPostIndex != null) {
                this.postList[this.editPostIndex] = res[0];
                this.editPostIndex = null;
              } else {
                let index = this.postList?.findIndex(
                  (obj) => obj?.id === res[0]?.id
                );
                if (this.postList[index]) {
                  this.postList[index] = res[0];
                } else {
                  this.postList.unshift(res[0]);
                }
                // this.getPostList();
              }
            }
          }
        }
      },
      (error: any) => {
        console.log(error);
      }
    );
    this.socketService.socket?.on('deleted-post', (res: any) => {
      if (res) {
        this.postList = this.postList.filter((post) => post.id !== res.id);
      }
    });
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.getPostList();
    this.getadvertizements();
  }

  getPostList(): void {
    this.activePage = 0;
    this.postList = [];

    if (this.parentComponent === 'HomeComponent') {
      this.loadMore();
    } else {
      this.getUsersPosts();
    }
  }

  getUsersPosts(): void {
    this.isPostLoader = true;
    this.activePage = this.activePage + 1;
    if (this.userId) {
      const data = {
        page: this.activePage,
        size: 10,
        profileId: this.userId,
        searchText: this.searchText,
      };
      this.postService.getPostsByProfileId(data).subscribe({
        next: (res: any) => {
          this.isPostLoader = false;
          this.isLoading = false;
          if (res?.data.data.length > 0) {
            this.postList = [...this.postList, ...res?.data.data]?.filter(
              (post, index, self) =>
                index === self?.findIndex((p) => p?.id === post?.id)
            );
          } else {
            this.hasMoreData = true;
          }
        },
        error: (error) => {
          console.log(error);
        },
        complete: () => {
          this.isPostLoader = false;
        },
      });
    } else {
      const data = {
        page: this.activePage,
        size: 10,
        profileId: this.profileId,
      };
      this.postService.getPostsByProfileId(data).subscribe({
        next: (res: any) => {
          this.isPostLoader = false;
          this.isLoading = false;
          if (res?.data.data.length > 0) {
            this.postList = [...this.postList, ...res?.data.data]?.filter(
              (post, index, self) =>
                index === self?.findIndex((p) => p?.id === post?.id)
            );
          } else {
            this.hasMoreData = true;
          }
        },
        error: (error) => {
          console.log(error);
        },
        complete: () => {
          this.isPostLoader = false;
        },
      });
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    if (this.parentComponent === 'HomeComponent') {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const thresholdFraction = 0.2;
      const threshold = windowHeight * thresholdFraction;

      if (scrollY + windowHeight >= documentHeight - threshold) {
        if (!this.isLoading && !this.hasMoreData) {
          this.loadMore();
        }
      }
    } else {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const thresholdFraction = 0;
      const threshold = windowHeight * thresholdFraction;

      if (scrollY + windowHeight >= documentHeight - threshold) {
        if (!this.isLoading && !this.hasMoreData) {
          this.getUsersPosts();
        }
      }
    }
  }

  loadMore(): void {
    this.isPostLoader = true;
    this.isLoading = true;

    if (!this.communityId && this.activePage === 0 && this.profileId) {
      this.getSeeFirstIdByProfileId(+this.profileId);
    }

    this.activePage = this.activePage + 1;
    this.postService
      .getPosts({
        profileId: this.profileId,
        communityId: this.communityId,
        page: this.activePage,
        size: 10,
      })
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.isPostLoader = false;
          if (res?.data?.length > 0) {
            this.postList = [...this.postList, ...res?.data]?.filter(
              (post, index, self) =>
                index === self?.findIndex((p) => p?.id === post?.id)
            );
          } else {
            this.hasMoreData = true;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.log(error);
        },
        complete: () => {
          this.isPostLoader = false;
          this.isLoading = false;
        },
      });
  }

  getSeeFirstIdByProfileId(id: number): void {
    this.seeFirstUserService.getSeeFirstIdByProfileId(id).subscribe({
      next: (res: any) => {
        if (res) {
          res.forEach((element: { SeeFirstProfileId: any }) => {
            this.seeFirstList.push(element.SeeFirstProfileId);
          });
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  onEditPostData(post: any, index: number): void {
    this.editPostIndex = index;
    this.onEditPost?.emit(post);
  }

  getUnsubscribeProfiles(): void {
    const profileId = +localStorage.getItem('profileId');

    if (profileId > 0) {
      this.unsubscribeProfileService.getByProfileId(profileId).subscribe({
        next: (res: any) => {
          res.map((ele) => {
            this.unSubscribeProfileIds.push(ele.profileId);
          });
          // this.unSubscribeProfileIds = res?.length > 0 ? res : [];
        },
      });
    }
  }

  getadvertizements(): void {
    this.postService.getAdvertisement().subscribe({
      next: (res: any) => {
        this.advertisementDataList = res;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  trackByPostId(index: number, post: any): number | string {
    return post.id;
  }
}
