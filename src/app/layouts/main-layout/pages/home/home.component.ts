import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/@shared/modals/confirmation-modal/confirmation-modal.component';
import { CommunityService } from 'src/app/@shared/services/community.service';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { PostService } from 'src/app/@shared/services/post.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { getTagUsersFromAnchorTags } from 'src/app/@shared/utils/utils';
import { VideoPostModalComponent } from 'src/app/@shared/modals/video-post-modal/video-post-modal.component';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { environment } from 'src/environments/environment';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { AddCommunityModalComponent } from '../communities/add-community-modal/add-community-modal.component';
import { AddFreedomPageComponent } from '../freedom-page/add-page-modal/add-page-modal.component';
import { isPlatformBrowser } from '@angular/common';
import { Howl } from 'howler';
import { EditPostModalComponent } from 'src/app/@shared/modals/edit-post-modal/edit-post-modal.component';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  postMessageInputValue: string = '';
  postMessageTags: any[];
  postData: any = {
    profileid: '',
    communityId: '',
    postdescription: '',
    meta: {},
    tags: [],
    file: {},
    imageUrl: '',
    posttype: 'S',
    pdfUrl: '',
    imagesList: [],
  };

  communitySlug: string;
  communityDetails: any;
  profileId = '';

  activeCommunityTab: number = 1;
  isNavigationEnd = false;
  searchText = '';
  @ViewChild('addMemberSearchDropdownRef', { static: false, read: NgbDropdown })
  addMemberSearchNgbDropdown: NgbDropdown;
  userList: any = [];
  memberIds: any = [];
  notificationId: number;
  buttonClicked = false;
  originalFavicon: HTMLLinkElement;
  postMediaData: any[] = [];
  currentImageIndex: number = this.postMediaData.length - 1;
  currentIndex: any;
  selectedFiles: any[] = [];
  constructor(
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private postService: PostService,
    public sharedService: SharedService,
    private socketService: SocketService,
    private toastService: ToastService,
    private communityService: CommunityService,
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private router: Router,
    public tokenService: TokenStorageService,
    private seoService: SeoService,
    private uploadFilesService: UploadFilesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.profileId = localStorage.getItem('profileId');
      this.postData.profileid = +this.profileId;

      this.route.paramMap.subscribe((paramMap) => {
        const name = paramMap.get('name');

        if (name) {
          this.communitySlug = name;
          this.getCommunityDetailsBySlug();
        } else {
          this.sharedService.advertizementLink = [];
        }

        this.isNavigationEnd = true;
      });
      const data = {
        title: 'Christian.team',
        url: `${location.href}`,
      };
      this.seoService.updateSeoMetaData(data);
    }
  }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
  }

  ngAfterViewInit(): void {
    const isRead = localStorage.getItem('isRead');
    if (isRead === 'N') {
      this.sharedService.isNotify = true;
    }
    this.socketService.socket?.on(
      'new-post-added',
      (res: any) => {
        this.spinner.hide();
        this.resetPost();
      },
      (error: any) => {
        this.spinner.hide();
        console.log(error);
      }
    );
  }

  ngOnDestroy(): void {}

  onPostFileSelect(event: any): void {
    if (this.postMediaData.length > 3) {
      this.toastService.warring(
        'Please choose up to 4 photos, videos, or GIFs.'
      );
      return;
    }
    const tagUserInput = document.querySelector(
      '.home-input app-tag-user-input .tag-input-div'
    ) as HTMLInputElement;
    if (tagUserInput) {
      tagUserInput.focus();
    }
    const files = event.target?.files;
    if (files.length > 4) {
      this.toastService.warring(
        'Please choose up to 4 photos, videos, or GIFs.'
      );
      return;
    }
    let existingFileType = '';
    if (this.postMediaData.length > 0) {
      existingFileType = this.postMediaData[0].file.type.split('/')[0];
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileData: any = {
        file: file,
        pdfName: null,
        imageUrl: null,
      };
      const fileType = file.type.split('/')[0];
      if (existingFileType && fileType !== existingFileType) {
        this.toastService.warring(
          'Please select only one type of file at a time.'
        );
        return;
      }
      if (
        file.type.includes('application/pdf') ||
        file.type.includes('application/msword') ||
        file.type.includes(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ) {
        fileData.pdfName = file.name;
      } else if (file.type.includes('image/')) {
        fileData.imageUrl = URL.createObjectURL(file);
      }
      this.selectedFiles.push(fileData);
      // console.log(`File ${i + 1}:`, fileData);
    }
    if (files?.[0]?.type?.includes('application/')) {
      this.postMediaData = this.selectedFiles;
    } else {
      this.postMediaData = (this.postMediaData || []).concat(
        this.selectedFiles
      );
    }
    // console.log('Selected files:', this.postMediaData);
  }

  removePostSelectedFile(index: number): void {
    if (index > -1 && index < this.postMediaData.length) {
      this.postMediaData.splice(index, 1);
    }
  }

  getCommunityDetailsBySlug(): void {
    if (this.communitySlug) {
      this.spinner.show();
      this.communityService.getCommunityBySlug(this.communitySlug).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res?.Id) {
            const details = res;
            if (res.pageType === 'page') {
              this.sharedService.getAdvertizeMentLink(res?.Id);
            } else {
              this.sharedService.advertizementLink = null;
            }
            const data = {
              title: details?.CommunityName,
              url: `${environment.webUrl}${details?.pageType}/${details?.slug}`,
              description: details.CommunityDescription,
              image: details?.coverImg,
            };
            this.seoService.updateSeoMetaData(data);

            if (details?.memberList?.length > 0) {
              details['memberIds'] = details?.memberList?.map(
                (member: any) => member?.profileId
              );
              details['adminIds'] = details?.memberList?.map((member: any) =>
                member.isAdmin === 'Y' ? member?.profileId : null
              );
            }

            this.communityDetails = details;
            this.postData.communityId = this.communityDetails?.Id;
          }
        },
        error: (error) => {
          this.spinner.hide();
          console.log(error);
        },
      });
    }
  }

  createCommunityAdmin(member: any): void {
    let data = {};
    if (member.isAdmin === 'Y') {
      data = {
        id: member?.Id,
        isAdmin: 'N',
      };
    } else {
      data = {
        id: member?.Id,
        isAdmin: 'Y',
      };
    }
    this.communityService.createCommunityAdmin(data).subscribe({
      next: (res: any) => {
        if (res) {
          this.toastService.success(res.message);
          this.getCommunityDetailsBySlug();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  addEmoji(event: { emoji: { native: any } }) {
    // const { message } = this;
    // const text = `${message}${event.emoji.native}`;
    // this.message = text;
  }

  uploadPostFileAndCreatePost(): void {
    this.buttonClicked = true;
    this.spinner.show();
    if (this.postData?.editImagesList?.length) {
      this.postMediaData = this.postMediaData?.concat(
        this.postData?.editImagesList
      );
    }
    if (this.postData?.postdescription || this.postMediaData?.length) {
      if (this.postMediaData?.length) {
        if (this.postMediaData?.[0]?.pdfName) {
          let media = this.postMediaData?.map((file) => file?.file);
          this.uploadFilesService.uploadFile(media[0]).subscribe({
            next: (res: any) => {
              if (res?.body?.url) {
                this.postData['pdfUrl'] = res?.body?.url;
                this.createOrEditPost();
              }
            },
            error: (err) => {
              this.spinner.hide();
            },
          });
        } else {
          let media = this.postMediaData?.map((file) => file?.file);
          this.postService.uploadFile(media).subscribe({
            next: (res: any) => {
              if (res?.body?.imagesList) {
                this.spinner.hide();
                // if (this.postData?.file?.type?.includes('application/pdf')) {
                //   this.postMediaData['pdfUrl'] = res?.body?.url;
                //   this.postMediaData['imageUrl'] = null;
                //   this.createOrEditPost();
                // } else {
                // this.postMediaData['file'] = null;
                // this.postData['pdfUrl'] = res?.body?.pdfUrl;
                if (this.postData['imagesList']?.length) {
                  for (const media of res?.body?.imagesList) {
                    this.postData['imagesList'].push(media);
                  }
                } else {
                  this.postData.imagesList = res?.body?.imagesList;
                }
                this.createOrEditPost();
                // }
              }
            },
            error: (err) => {
              this.spinner.hide();
            },
          });
        }
      } else {
        this.spinner.hide();
        this.createOrEditPost();
      }
    } else {
      this.createOrEditPost();
    }
  }

  createOrEditPost(): void {
    this.postData.tags = getTagUsersFromAnchorTags(this.postMessageTags);
    if (this.postData?.postdescription || this.postData?.imagesList) {
      if (!(this.postData?.meta?.metalink || this.postData?.metalink)) {
        this.postData.metalink = null;
        this.postData.title = null;
        this.postData.metaimage = null;
        this.postData.metadescription = null;
      }
      this.toastService.success('Post created successfully.');
      console.log(this.postData);

      this.socketService?.createOrEditPost(this.postData);
      this.buttonClicked = false;
      this.resetPost();
    }
  }

  onTagUserInputChangeEvent(data: any): void {
    // this.extractImageUrlFromContent(data.html);
    this.postData.postdescription = this.extractImageUrlFromContent(
      data?.html.replace(/<div>\s*<br\s*\/?>\s*<\/div>\s*$/, '')
    );
    this.postData.meta = data?.meta;
    this.postMessageTags = data?.tags;
  }

  resetPost() {
    this.postMediaData = [];
    this.postData['id'] = '';
    this.postData['postdescription'] = '';
    this.postData['imagesList'] = '';
    this.postData['meta'] = {};
    this.postData['tags'] = [];
    this.postData['file'] = {};
    this.postData['imageUrl'] = '';
    this.postData['pdfUrl'] = '';
    this.selectedFiles = [];
    this.postMessageInputValue = ' ';
    setTimeout(() => {
      this.postMessageInputValue = '';
    }, 100);
    this.postMessageTags = [];
  }

  onEditPost(post: any): void {
    if (post.posttype === 'V') {
      this.openUploadVideoModal(post);
    } else {
      this.openUploadEditPostModal(post);
    }
  }

  editCommunity(data): void {
    let modalRef: any;
    if (data.pageType === 'community') {
      modalRef = this.modalService.open(AddCommunityModalComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
      });
    } else {
      modalRef = this.modalService.open(AddFreedomPageComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
      });
      data.link1 = this.sharedService?.advertizementLink[0]?.url;
      data.link2 = this.sharedService?.advertizementLink[1]?.url;
    }
    modalRef.componentInstance.title = `Edit ${data.pageType === 'community' ? 'Church' : 'Topics'} Details`;
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.confirmButtonLabel = 'Save';
    modalRef.componentInstance.closeIcon = true;
    modalRef.componentInstance.data = data;
    modalRef.result.then((res) => {
      if (res === 'success') {
        if (data.pageType === 'community') {
          this.router.navigate(['my-church']);
        } else {
          this.router.navigate(['pages']);
        }
      }
    });
  }

  joinCommunity(id?): void {
    if (!this.buttonClicked) {
      const profileId = id || localStorage.getItem('profileId');
      const data = {
        profileId: profileId,
        communityId: this.communityDetails?.Id,
        IsActive: 'Y',
        isAdmin: 'N',
      };
      this.searchText = '';
      this.communityService.joinCommunity(data).subscribe(
        (res: any) => {
          if (res) {
            this.getCommunityDetailsBySlug();
          }
        },
        (error) => {
          console.log(error);
        }
      );
      this.buttonClicked = true;
    }
  }

  removeFromCommunity(id?): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = `Leave ${this.communityDetails.pageType === 'community' ? 'Church' : 'Topics'}`;
    modalRef.componentInstance.confirmButtonLabel = id ? 'Remove' : 'Leave';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    if (id) {
      modalRef.componentInstance.message = `Are you sure want to remove this member from ${this.communityDetails.pageType === 'community' ? 'Church' : 'Topics'}?`;
    } else {
      modalRef.componentInstance.message = `Are you sure want to Leave from this ${this.communityDetails.pageType === 'community' ? 'Church' : 'Topics'}?`;
    }
    modalRef.result.then((res) => {
      if (res === 'success') {
        const profileId = Number(localStorage.getItem('profileId'));
        this.communityService
          .removeFromCommunity(this.communityDetails?.Id, id || profileId)
          .subscribe({
            next: (res: any) => {
              if (res) {
                this.toastService.success(res.message);
                this.getCommunityDetailsBySlug();
              }
            },
            error: (error) => {
              console.log(error);
              this.toastService.danger(error.message);
            },
          });
      }
    });
  }

  deleteOrLeaveCommunity(actionType: 'delete' | 'leave'): void {
    const actionTitle = actionType === 'delete' ? 'Delete' : 'Leave';
    const modalTitle = `${actionTitle} ${this.communityDetails.pageType === 'community' ? 'Church' : 'Topics'}`;
    const modalMessage = `Are you sure you want to ${actionType} this ${this.communityDetails.pageType === 'community' ? 'Church' : 'Topics'}?`;
    const confirmButtonLabel = actionTitle;
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = modalTitle;
    modalRef.componentInstance.confirmButtonLabel = confirmButtonLabel;
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message = modalMessage;
    modalRef.result.then((res) => {
      if (res === 'success') {
        const serviceFunction =
          actionType === 'delete'
            ? this.communityService.deleteCommunity
            : this.communityService.removeFromCommunity;
        let serviceParams: any[];
        if (actionType === 'delete') {
          serviceParams = [this.communityDetails?.Id];
        } else {
          serviceParams = [this.communityDetails?.Id, this.profileId];
        }

        serviceFunction.apply(this.communityService, serviceParams).subscribe({
          next: (res: any) => {
            if (res) {
              this.toastService.success(res.message);
              // this.getCommunityDetailsBySlug();
              this.router.navigate([
                `${
                  this.communityDetails.pageType === 'community'
                    ? 'my-church'
                    : 'pages'
                }`,
              ]);
            }
          },
          error: (error) => {
            console.log(error);
            this.toastService.success(error.message);
          },
        });
      }
    });
  }

  getUserList(): void {
    this.customerService.getProfileList(this.searchText).subscribe({
      next: (res: any) => {
        if (res?.data?.length > 0) {
          this.userList = res.data;
          this.addMemberSearchNgbDropdown?.open();
        } else {
          this.userList = [];
          this.addMemberSearchNgbDropdown?.close();
        }
      },
      error: () => {
        this.userList = [];
        this.addMemberSearchNgbDropdown?.close();
      },
    });
  }

  openUploadVideoModal(post: any = {}): void {
    const modalRef = this.modalService.open(VideoPostModalComponent, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.title = post.id ? `Edit Video` : `Upload Video`;
    modalRef.componentInstance.confirmButtonLabel = post.id
      ? `Save`
      : 'Create Post';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.communityId = this.communityDetails?.Id;
    modalRef.componentInstance.post = post.id ? post : null;
    modalRef.result.then((res) => {
      if (res === 'success') {
        this.socketService.socket?.on('new-post');
      }
    });
  }

  openUploadEditPostModal(post: any = {}): void {
    const modalRef = this.modalService.open(EditPostModalComponent, {
      centered: true,
      backdrop: 'static',
    });
    const postData = { ...post };
    modalRef.componentInstance.title = `Edit Post`;
    modalRef.componentInstance.confirmButtonLabel = `Save`;
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.communityId = this.communityDetails?.Id;
    modalRef.componentInstance.data = postData.id ? postData : null;
    modalRef.result.then((res) => {
      if (res.id) {
        this.postData = res;
        this.uploadPostFileAndCreatePost();
      }
    });
  }
  openAlertMessageImg(fileInput: HTMLInputElement): void {
    if (this.postMediaData.length) {
      fileInput.click();
    } else {
      const modalRef = this.modalService.open(ConfirmationModalComponent, {
        centered: true,
      });
      modalRef.componentInstance.title = '';
      modalRef.componentInstance.confirmButtonLabel = 'Ok';
      modalRef.componentInstance.cancelButtonLabel = 'Cancel';
      modalRef.componentInstance.message = `Add up to 4 images`;
      modalRef.result.then((res) => {
        if (res === 'success') {
          fileInput.click();
        }
      });
    }
  }

  openAlertMessage(): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = `Warning message`;
    modalRef.componentInstance.confirmButtonLabel = 'Ok';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message = `Videos on Christian.team home are limited to 2 Minutes!
    Videos must be a mp4 format`;
    modalRef.result.then((res) => {
      if (res === 'success') {
        this.openUploadVideoModal();
      }
    });
  }
  extractImageUrlFromContent(content: string) {
    const contentContainer = document.createElement('div');
    contentContainer.innerHTML = content;
    const imgTag = contentContainer.querySelector('img');
    if (imgTag) {
      const imgTitle = imgTag.getAttribute('title');
      const imgStyle = imgTag.getAttribute('style');
      const imageGif = imgTag
        .getAttribute('src')
        .toLowerCase()
        .endsWith('.gif');
      if (!imgTitle && !imgStyle && !imageGif) {
        this.focusTagInput();
        const copyImage = imgTag.getAttribute('src');
        let copyImageTag = '<img\\s*src\\s*=\\s*""\\s*alt\\s*="">';
        const postText = `<div>${content
          ?.replace(copyImage, '')
          ?.replace(new RegExp(copyImageTag, 'g'), '')}</div>`;
        const base64Image = copyImage
          .trim()
          ?.replace(/^data:image\/\w+;base64,/, '');
        try {
          const binaryString = window.atob(base64Image);
          const uint8Array = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([uint8Array], { type: 'image/jpeg' });
          const fileName = `copyImage-${new Date().getTime()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const fileData: any = {
            file: file,
            imageUrl: URL.createObjectURL(file),
          };
          this.postMediaData[0] = fileData;
        } catch (error) {
          console.error('Base64 decoding error:', error);
        }
        if (postText !== '<div></div>') {
          return postText;
        }
      } else if (imageGif) {
        return content;
      }
    } else {
      return content;
    }
    return null;
  }

  focusTagInput() {
    const tagUserInput = document.querySelector(
      'app-tag-user-input .tag-input-div'
    ) as HTMLInputElement;
    if (tagUserInput) {
      setTimeout(() => {
        tagUserInput.innerText = tagUserInput.innerText + ' '.slice(0, -1);
        const range = document.createRange();
        const selection = window.getSelection();
        if (selection) {
          range.selectNodeContents(tagUserInput);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 100);
    }
  }
}
