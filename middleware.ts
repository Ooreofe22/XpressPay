import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const ua = request.headers.get('user-agent') || ''
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)

    if (isMobile && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/app', request.url))
    }
}

export const config = {
    matcher: '/',
}