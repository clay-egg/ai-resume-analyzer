import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, fs, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [statusText, setStatusText] = useState("");

    const loadFiles = async () => {
        setIsRefreshing(true);
        const appFiles = (await fs.readDir("./")) as FSItem[] | undefined;
        setFiles(appFiles || []);
        setIsRefreshing(false);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [auth.isAuthenticated, isLoading, navigate]);

    const handleDelete = async () => {
        setIsDeleting(true);
        setStatusText("Clearing uploaded files and saved resume data...");

        await Promise.all(
            files.map(async (file) => {
                try {
                    await fs.delete(file.path);
                } catch (error) {
                    console.warn(`Unable to delete file at ${file.path}`, error);
                }
            })
        );
        await kv.flush();
        await loadFiles();

        setStatusText("All app data has been cleared.");
        setShowConfirm(false);
        setIsDeleting(false);
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
                    Loading data tools...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
                    Error: {error}
                </div>
            </main>
        );
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover bg-fixed">
            <Navbar />

            <section className="main-section">
                <div className="page-heading">
                    <p className="rounded-full border border-rose-100 bg-white/80 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">
                        Data management
                    </p>
                    <h1>Clear Saved Resume Data</h1>
                    <h2>Review uploaded files and remove all app data when you want a fresh start.</h2>
                </div>

                <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-lg font-semibold text-slate-950">
                                Signed in as {auth.user?.username || "your account"}
                            </p>
                            <p className="text-sm text-slate-500">
                                {files.length} uploaded {files.length === 1 ? "file" : "files"} found.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadFiles}
                            disabled={isRefreshing || isDeleting}
                            className="min-h-11 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                        {files.length > 0 ? (
                            <div className="divide-y divide-slate-200">
                                {files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between gap-4 bg-white px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-slate-800">{file.name}</p>
                                            <p className="text-sm text-slate-500">{file.path}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 px-4 py-8 text-center text-slate-500">
                                No uploaded files found.
                            </div>
                        )}
                    </div>

                    {statusText && (
                        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {statusText}
                        </p>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <Link
                            to="/"
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Back to Dashboard
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            disabled={files.length === 0 || isDeleting}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Wipe App Data
                        </button>
                    </div>
                </div>

                {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                            <h2 className="!text-slate-950 font-bold">Wipe all app data?</h2>
                            <p className="mt-2 text-slate-600">
                                This deletes uploaded resume files and clears all saved app data. This action cannot be undone.
                            </p>
                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    className="min-h-11 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="min-h-11 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isDeleting ? "Wiping..." : "Wipe App Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
};

export default WipeApp;
