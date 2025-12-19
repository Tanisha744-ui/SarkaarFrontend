import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Landingpage } from './landingpage/landingpage';
import { Index } from './index/index';

import { Dashboard } from './dashboard/dashboard';

import { ImposterGame } from './imposter-game/imposter-game';
import { TambolaGame } from './tambola-game/tambola-game';
import { Tambola } from './tambola/tambola';
import { ImposterMode } from './imposter-mode/imposter-mode';
import { ImposterOffline } from './imposter-offline/imposter-offline';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'index', component: Index },
  { path: 'dashboard', component: Dashboard },
  { path: 'game', component: Landingpage },
  { path: 'imposter-mode', component: ImposterMode },
  { path: 'imposter-game', component: ImposterGame },
  { path: 'imposter-offline', component: ImposterOffline },
  { path: 'tambola', component: Tambola },
  { path: 'tambola-game', component: TambolaGame }

];
