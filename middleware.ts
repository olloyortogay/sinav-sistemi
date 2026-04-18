import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Admin paneli ve Telegram API'si korumalı — Clerk token gerektirir
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/sendToTelegramBulk(.*)',
  '/api/saveResult(.*)',
  '/results(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js internals ve statik dosyaları hariç tut
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
