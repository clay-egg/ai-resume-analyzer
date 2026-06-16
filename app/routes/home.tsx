import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useCallback, useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumind" },
        { name: "description", content: "Smart feedback for your dream job!" },
    ];
}

export default function Home() {
    const { auth, kv, fs } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);
    const [deletingResumeId, setDeletingResumeId] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [hiddenStaleCount, setHiddenStaleCount] = useState(0);

    useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated])

    const loadResumes = useCallback(async () => {
        setLoadingResumes(true);

        const [resumes, files] = await Promise.all([
            kv.list('resume:*', true) as Promise<KVItem[] | undefined>,
            fs.readDir("./") as Promise<FSItem[] | undefined>,
        ]);
        const existingFilePaths = new Set((files || []).map((file) => file.path));

        let staleCount = 0;
        const parsedResumes = resumes?.flatMap((resume) => {
            try {
                if (resume.value === "__deleted__") {
                    return [];
                }

                const parsedResume = JSON.parse(resume.value) as Resume;
                const hasFiles = existingFilePaths.has(parsedResume.resumePath)
                    && existingFilePaths.has(parsedResume.imagePath);

                if (!hasFiles) {
                    staleCount += 1;
                    console.warn(`Skipping resume with missing file: ${parsedResume.resumePath} or ${parsedResume.imagePath}`);
                    return [];
                }

                return [parsedResume];
            } catch {
                console.warn(`Skipping invalid resume record: ${resume.key}`);
                return [];
            }
        })

        setResumes(parsedResumes || []);
        setHiddenStaleCount(staleCount);
        setLoadingResumes(false);
    }, [fs, kv]);

    useEffect(() => {
        loadResumes()
    }, [loadResumes]);

    const deleteFileIfPresent = async (path?: string) => {
        if (!path) return;

        try {
            await fs.delete(path);
        } catch (error) {
            console.warn(`Unable to delete file at ${path}`, error);
        }
    };

    const deleteResumeData = async (resume: Resume) => {
        await Promise.all([
            deleteFileIfPresent(resume.resumePath),
            deleteFileIfPresent(resume.imagePath),
            kv.delete(`resume:${resume.id}`),
        ]);
    };

    const handleDeleteResume = async () => {
        if (!deleteTarget) return;

        setDeletingResumeId(deleteTarget.id);
        try {
            await deleteResumeData(deleteTarget);
            setResumes((current) => current.filter((resume) => resume.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (error) {
            console.error("Failed to delete resume", error);
        } finally {
            setDeletingResumeId('');
        }
    };

    const handleClearAll = async () => {
        setIsClearing(true);
        try {
            await Promise.all(resumes.map((resume) => deleteResumeData(resume)));
            if (hiddenStaleCount > 0) {
                await kv.flush();
            }
            setResumes([]);
            setHiddenStaleCount(0);
            setShowClearConfirm(false);
        } catch (error) {
            console.error("Failed to clear resume data", error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleClearStaleRecords = async () => {
        setIsClearing(true);
        try {
            await kv.flush();
            setResumes([]);
            setHiddenStaleCount(0);
        } catch (error) {
            console.error("Failed to clear stale records", error);
        } finally {
            setIsClearing(false);
        }
    };

    return <main className="bg-[url('/images/bg-main.svg')] bg-cover bg-fixed">
        <Navbar />

        <section className="main-section">
            <div className="page-heading">
                <p className="rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
                    AI resume review dashboard
                </p>
                <h1>Track Your Applications & Resume Ratings</h1>
                {!loadingResumes && resumes?.length === 0 ? (
                    <h2>No resumes found. Upload your first resume to get feedback.</h2>
                ): (
                    <h2>Review your submissions and check AI-powered feedback.</h2>
                )}
            </div>
            {!loadingResumes && resumes.length > 0 && (
                <div className="flex w-full flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <p className="font-semibold text-slate-900">{resumes.length} saved {resumes.length === 1 ? 'resume' : 'resumes'}</p>
                        <p className="text-sm text-slate-500">
                            Remove individual resumes or clear your saved resume history.
                            {hiddenStaleCount > 0 && ` ${hiddenStaleCount} stale ${hiddenStaleCount === 1 ? 'record was' : 'records were'} hidden.`}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                            to="/wipe"
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Data Tools
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-rose-100 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                            Clear All Data
                        </button>
                    </div>
                </div>
            )}
            {loadingResumes && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/85 p-8 shadow-sm">
                    <img src="/images/resume-scan-2.gif" className="w-[200px]" />
                </div>
            )}

            {!loadingResumes && resumes.length > 0 && (
                <div className="resumes-section">
                    {resumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            onDelete={setDeleteTarget}
                            isDeleting={deletingResumeId === resume.id}
                        />
                    ))}
                </div>
            )}

            {!loadingResumes && resumes?.length === 0 && (
                <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white/85 p-8 text-center shadow-sm">
                    <p className="text-slate-600">
                        {hiddenStaleCount > 0
                            ? `${hiddenStaleCount} stale saved ${hiddenStaleCount === 1 ? 'record points' : 'records point'} to missing files. Clear them for a fresh dashboard.`
                            : 'Upload a PDF resume and get structured ATS, content, tone, and skills feedback.'}
                    </p>
                    {hiddenStaleCount > 0 ? (
                        <button
                            type="button"
                            onClick={handleClearStaleRecords}
                            disabled={isClearing}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isClearing ? 'Clearing...' : 'Clear Stale Records'}
                        </button>
                    ) : (
                        <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                            Upload Resume
                        </Link>
                    )}
                </div>
            )}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h2 className="!text-slate-950 font-bold">Delete this resume?</h2>
                        <p className="mt-2 text-slate-600">
                            This removes the saved review, PDF, and preview image for {deleteTarget.companyName || deleteTarget.jobTitle || 'this resume'}.
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            If one of those files is already missing, the saved dashboard record will still be removed.
                        </p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="min-h-11 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteResume}
                                disabled={Boolean(deletingResumeId)}
                                className="min-h-11 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deletingResumeId ? 'Deleting...' : 'Delete Resume'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h2 className="!text-slate-950 font-bold">Clear all resume data?</h2>
                        <p className="mt-2 text-slate-600">
                            This removes all saved resume reviews, uploaded PDFs, and preview images from this app.
                        </p>
                        {hiddenStaleCount > 0 && (
                            <p className="mt-2 text-sm text-slate-500">
                                This will also clear {hiddenStaleCount} stale saved {hiddenStaleCount === 1 ? 'record' : 'records'} with missing files.
                            </p>
                        )}
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowClearConfirm(false)}
                                className="min-h-11 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={isClearing}
                                className="min-h-11 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isClearing ? 'Clearing...' : 'Clear All Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    </main>
}
