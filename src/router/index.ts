import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: '/basic-stack-image',
          name: 'basicStackImage',
          component: () => import('../views/example/ExampleStackOfImageView.vue')
        },
        {
          path: '/local-file',
          name: 'localFile',
          component: () => import('../views/example/ExampleLocalFileView.vue')
        },
        {
          path: '/local-file-with-tools',
          name: 'localFileWithTools',
          component: () => import('../views/example/ExampleFileUploadManyToolView.vue')
        },
        {
          path: '/example-unzip',
          name: 'unzipFile',
          component: () => import('../views/example/ExampleUnzipFileView.vue')
        },
        {
          path: '/manipulation-tools',
          name: 'manipulationTools',
          component: () => import('../views/example/ExampleManipulationToolsView.vue')
        },
        {
          path: '/video',
          name: 'video',
          component: () => import('../views/example/ExampleVideoView.vue')
        },
        {
          path: '/video-with-tools',
          name: 'videoTools',
          component: () => import('../views/example/ExampleVideoToolsView.vue')
        }
      ]
    },
    {
      path: '/empty',
      name: 'empty',
      component: () => import('../views/layout/EmptyLayout.vue'),
      children: [
        {
          path: '/empty/memory-file-view',
          name: 'memoryFileView',
          component: () => import('../views/example/ExampleMemoryFileView.vue')
        }
      ]
    }
  ]
});

export default router;
