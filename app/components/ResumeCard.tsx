import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

interface ResumeCardProps {
    resume: Resume;
    onDelete?: (resume: Resume) => void;
    isDeleting?: boolean;
}

const ResumeCard = ({ resume, onDelete, isDeleting = false }: ResumeCardProps) => {
    const { id, companyName, jobTitle, feedback, imagePath } = resume;
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const [previewError, setPreviewError] = useState(false);
    const score = typeof feedback?.overallScore === 'number' ? feedback.overallScore : 0;

    useEffect(() => {
        let objectUrl = '';
        let isMounted = true;

        const loadResume = async () => {
            try {
                const blob = await fs.read(imagePath);
                if(!blob || !isMounted) return;
                objectUrl = URL.createObjectURL(blob);
                setResumeUrl(objectUrl);
                setPreviewError(false);
            } catch {
                if (isMounted) {
                    setResumeUrl('');
                    setPreviewError(true);
                }
            }
        }

        loadResume();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [fs, imagePath]);

    return (
        <article className="resume-card group animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex min-w-0 flex-col gap-1">
                    {companyName && <h2 className="!text-slate-950 font-bold break-words text-2xl">{companyName}</h2>}
                    {jobTitle && <h3 className="text-base break-words text-slate-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={score} />
                </div>
            </div>
            <Link to={`/resume/${id}`} className="block flex-1">
                {resumeUrl ? (
                    <div className="gradient-border animate-in fade-in duration-1000 overflow-hidden">
                        <div className="w-full overflow-hidden rounded-xl bg-slate-100">
                            <img
                                src={resumeUrl}
                                alt="resume"
                                className="h-[300px] w-full object-cover object-top transition duration-500 group-hover:scale-[1.02] sm:h-[360px]"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:h-[360px]">
                        <p className="font-semibold text-slate-700">
                            {previewError ? 'Preview file missing' : 'Loading preview...'}
                        </p>
                        {previewError && (
                            <p className="mt-2 text-sm text-slate-500">
                                The saved record exists, but its image file was removed.
                            </p>
                        )}
                    </div>
                )}
            </Link>
            {onDelete && (
                <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onDelete(resume)}
                    className="mt-auto inline-flex min-h-10 items-center justify-center rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isDeleting ? 'Deleting...' : 'Delete Resume'}
                </button>
            )}
        </article>
    )
}
export default ResumeCard
