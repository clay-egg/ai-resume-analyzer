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
    const navigate = useNavigate();

    useEffect(()=>{
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(()=> {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) return;

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlop = await fs.read(data.imagePath);
            if(!imageBlop) return;
            const imageUrl = URL.createObjectURL(imageBlop);
            setImageUrl(imageUrl);

            if (isFeedback(data.feedback)) {
                setFeedback(data.feedback);
                setFeedbackError('');
            } else {
                const message = typeof data.feedback?.error === 'string'
                    ? data.feedback.error
                    : 'The saved AI feedback is incomplete. Please upload and analyze the resume again.';
                setFeedback(null);
                setFeedbackError(message);
            }
            console.log({resumeUrl, imageUrl, feedback: data.feedback});
        }

        loadResume();
    }, [id]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-grey-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedbackError ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
                            {feedbackError}
                        </div>
                    ) : feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in druation-1000">
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
