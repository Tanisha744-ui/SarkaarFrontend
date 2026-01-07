import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Landingpage } from './landingpage/landingpage';
import { Index } from './index/index';
import { Dashboard } from './dashboard/dashboard';
import { ImposterGame } from './imposter-game/imposter-game';
import { TambolaGame } from './tambola-game/tambola-game';
import { Tambola } from './tambola/tambola';
import { TeamSelection } from './team-selection/team-selection';
import { SarkaarModeSelect } from './sarkaar-mode-select/sarkaar-mode-select';
import { SarkaarRoom } from './sarkaar-room/sarkaar-room';
import { TambolaOnlineComponent } from './tambola-online/tambola-online.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'index', component: Index },
  { path: 'dashboard', component: Dashboard },
  { path: 'sarkaar-mode', component: SarkaarModeSelect },
  { path: 'sarkaar-room', component: SarkaarRoom },
  { path: 'team-selection', component: TeamSelection },
  { path: 'game', component: Landingpage },
  { path: 'imposter-game', component: ImposterGame },
  { path: 'tambola', component: Tambola },
  { path: 'tambola-game', component: TambolaGame },
  { path: 'tambola-online-setup', component: TambolaOnlineComponent },
  { path: 'tambola-online', component: TambolaOnlineComponent } 
];
