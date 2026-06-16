import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta = () => ([
    { title: 'Resumind | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated) navigate(next);
    }, [auth.isAuthenticated, next])

    return (
        <main className="flex min-h-screen items-center justify-center bg-[url('/images/bg-auth.svg')] bg-cover p-4 sm:p-6">
            <div className="gradient-border w-full max-w-xl overflow-hidden">
                <section className="flex flex-col gap-8 rounded-xl bg-white/95 p-6 backdrop-blur-sm sm:p-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <img 
                                src="/favicon.ico" 
                                alt="RESUMIND Logo"
                                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                                onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAxMmg2bS0zIDN2LTZNMTIgM2E5IDkgMCAxMS0uMDAxIDE4QTEuNSAxLjUgMCAwMDEuNSAxOS41VjIwYTEuNSAxLjUgMCAwMDEuNSAxLjVBMiAyIDAgMDA2IDE5djBhMiAyIDAgMDEyLTJoOGEyIDIgMCAwMTIgMnYwYTIgMiAwIDAwMiAyIDEuNSAxLjUgMCAwMDEuNS0xLjV2LS41QTIgMiAwIDAwMjIgMThhMTAgMTAgMCAwMC0xMC0xMCIvPjwvc3ZnPg=='
                                }}
                            />
                            <h1 className="text-4xl font-bold sm:text-5xl">
                                RESUMIND
                            </h1>
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Your AI-Powered Resume Assistant</h2>
                        <p className="text-base text-slate-600 sm:text-lg">Sign in to continue your job journey</p>
                    </div>

                    <div className="space-y-6">
                        {isLoading ? (
                            <button 
                                disabled
                                className="primary-button cursor-not-allowed opacity-75"
                            >
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Signing you in...
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button 
                                        onClick={auth.signOut}
                                        className="primary-button"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                ) : (
                                    <button 
                                        onClick={auth.signIn}
                                        className="primary-button"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Continue with Your Account
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default Auth
