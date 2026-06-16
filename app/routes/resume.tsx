import {Link, useNavigate, useParams} from 'react-router';
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import Details from "~/components/Details";
import ATS from "~/components/ATS";

const isFeedback = (value: unknown): value is Feedback => {
    if (!value || typeof value !== 'object') return false;

    const feedback = value as Partial<Feedback>;
    return typeof feedback.overallScore === 'number'
        && typeof feedback.ATS?.score === 'number'
        && Array.isArray(feedback.ATS.tips)
        && typeof feedback.toneAndStyle?.score === 'number'
        && Array.isArray(feedback.toneAndStyle.tips)
        && typeof feedback.content?.score === 'number'
        && Array.isArray(feedback.content.tips)
        && typeof feedback.structure?.score === 'number'
        && Array.isArray(feedback.structure.tips)
        && typeof feedback.skills?.score === 'number'
        && Array.isArray(feedback.skills.tips);
}

const getFeedbackError = (value: unknown) => {
    if (value && typeof value === 'object' && 'error' in value) {
        const error = (value as { error?: unknown }).error;
        return typeof error === 'string' ? error : null;
    }

    return null;
}

export const meta = () => ([
    { title: 'Resumind | Review' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [feedbackError, setFeedbackError] = useState('');
    const [recordError, setRecordError] = useState('');
    const navigate = useNavigate();

    useEffect(()=>{
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(()=> {
        let resumeObjectUrl = '';
        let imageObjectUrl = '';

        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) {
                setRecordError('This saved resume could not be found.');
                return;
            }
            if (resume === "__deleted__") {
                setRecordError('This saved resume has been deleted.');
                return;
            }

            let data: Omit<Resume, 'feedback'> & { feedback: unknown };
            try {
                data = JSON.parse(resume) as Resume;
            } catch {
                setRecordError('This saved resume record is invalid. Please delete it from the dashboard or upload it again.');
                return;
            }
            const files = await fs.readDir("./");
            const existingFilePaths = new Set((files || []).map((file) => file.path));

            if (!existingFilePaths.has(data.resumePath) || !existingFilePaths.has(data.imagePath)) {
                setRecordError('This saved resume points to files that no longer exist. Please delete it from the dashboard or upload it again.');
                return;
            }

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            resumeObjectUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeObjectUrl);

            const imageBlop = await fs.read(data.imagePath);
            if(!imageBlop) return;
            imageObjectUrl = URL.createObjectURL(imageBlop);
            setImageUrl(imageObjectUrl);

            if (isFeedback(data.feedback)) {
                setFeedback(data.feedback);
                setFeedbackError('');
            } else {
                const message = getFeedbackError(data.feedback)
                    || 'The saved AI feedback is incomplete. Please upload and analyze the resume again.';
                setFeedback(null);
                setFeedbackError(message);
            }
            console.log({resumeUrl: resumeObjectUrl, imageUrl: imageObjectUrl, feedback: data.feedback});
        }

        loadResume();

        return () => {
            if (resumeObjectUrl) URL.revokeObjectURL(resumeObjectUrl);
            if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
        };
    }, [id, fs, kv]);

    return (
        <main className="!pt-0 bg-slate-50">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-sm font-semibold text-slate-800">Back to Homepage</span>
                </Link>
            </nav>

            <div className="mx-auto flex w-full max-w-7xl flex-row max-lg:flex-col-reverse">
                <section className="feedback-section sticky top-[69px] h-[calc(100vh-69px)] items-center justify-center bg-[url('/images/bg-small.svg')] bg-cover max-lg:static max-lg:h-auto">
                    {imageUrl && resumeUrl && (
                        <div className="gradient-border h-[90%] w-fit animate-in fade-in duration-1000 max-lg:h-auto max-sm:m-0">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="h-full max-h-[780px] w-full rounded-xl object-contain"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <div className="flex flex-col gap-2">
                        <p className="w-fit rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
                            Detailed report
                        </p>
                        <h2 className="text-3xl !text-slate-950 font-bold sm:text-4xl">Resume Review</h2>
                    </div>
                    {recordError ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
                            {recordError}
                        </div>
                    ) : feedbackError ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
                            {feedbackError}
                        </div>
                    ) : feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || [] } />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    )
}

export default Resume
