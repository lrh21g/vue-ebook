import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/book-store'
  },
  {
    path: '/ebook',
    component: () => import('./views/ebook/index.vue'),
    children: [{
      path: ':fileName',
      component: () => import('./components/ebook/EbookReader.vue')
    }]
  },
  {
    path: '/book-store',
    component: resolve => require(['@/views/store/index.vue'], resolve),
    redirect: '/book-store/shelf',
    children: [
      {
        path: '/book-store/shelf',
        component: resolve => require(['@/views/store/bookShelf.vue'], resolve),
        meta: { key: 1 }
      },
      {
        path: '/book-store/category',
        component: resolve => require(['@/views/store/bookCategory.vue'], resolve),
        meta: { key: 2 }
      },
      {
        path: '/book-store/home',
        component: resolve => require(['@/views/store/bookHome.vue'], resolve),
        meta: { key: 3 }
      },
      {
        path: '/book-store/list',
        component: resolve => require(['@/views/store/bookList.vue'], resolve),
        meta: { key: 4 }
      },
      {
        path: '/book-store/detail',
        component: resolve => require(['@/views/store/bookDetail.vue'], resolve),
        meta: { key: 5 }
      },
      {
        path: '/book-store/book-speaking',
        component: resolve => require(['@/views/store/bookSpeaking.vue'], resolve),
        meta: { key: 6 }
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

export default router
