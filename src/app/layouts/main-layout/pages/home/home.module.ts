import { NgModule } from '@angular/core';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { SharedModule } from 'src/app/@shared/shared.module';

@NgModule({
  declarations: [HomeComponent],
  exports: [],
  imports: [HomeRoutingModule, SharedModule],
})
export class HomeModule {}
