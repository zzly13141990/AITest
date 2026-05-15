import type { RouteRecordRaw } from 'vue-router';
import Home from '../pages/Home.vue';
import SingleGame from '../pages/SingleGame.vue';
import BattleGame from '../pages/BattleGame.vue';
import GameEnd from '../pages/GameEnd.vue';
import Rankings from '../pages/Rankings.vue';
import Achievements from '../pages/Achievements.vue';
import { ROUTES } from '../constants';

export const routes: RouteRecordRaw[] = [
  {
    path: ROUTES.HOME,
    name: 'Home',
    component: Home
  },
  {
    path: ROUTES.SINGLE,
    name: 'SingleGame',
    component: SingleGame
  },
  {
    path: ROUTES.BATTLE,
    name: 'BattleGame',
    component: BattleGame
  },
  {
    path: ROUTES.END,
    name: 'GameEnd',
    component: GameEnd
  },
  {
    path: '/rankings',
    name: 'Rankings',
    component: Rankings
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: Achievements
  }
];
