import { Link } from "react-router";
import { usePuterStore } from "~/lib/puter";

const Navbar = () => {
    const { auth } = usePuterStore();

    return (
        <nav className="navbar">
            <Link to="/" className="shrink-0">
                <p className="text-xl font-bold text-gradient sm:text-2xl">RESUMIND</p>
            </Link>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Link to="/upload" className="primary-button w-fit whitespace-nowrap px-4">
                    Upload Resume
                </Link>
                {auth.isAuthenticated && (
                    <button 
                        onClick={auth.signOut}
                        className="flex min-h-11 items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 sm:px-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                )}
            </div>
        </nav>
    )
}

export default Navbar
