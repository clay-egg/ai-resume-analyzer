import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

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

type ResumeUploadData = Omit<Resume, 'feedback'> & {
    jobDescription: string;
    feedback: Feedback | '';
}

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        try {
            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file]);
            if(!uploadedFile) throw new Error('Failed to upload file');

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if(!imageFile.file) throw new Error('Failed to convert PDF to image');

            setStatusText('Uploading the image...');
            const uploadedImage = await fs.upload([imageFile.file]);
            if(!uploadedImage) throw new Error('Failed to upload image');

            setStatusText('Extracting resume text...');
            const resumeText = await ai.img2txt(imageFile.file);
            if(!resumeText) throw new Error('Failed to extract text from resume image');

            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data: ResumeUploadData = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Analyzing...');

            const feedback = await ai.feedback(
                resumeText,
                prepareInstructions({ jobTitle, jobDescription })
            )
            if (!feedback) throw new Error('Failed to analyze resume');

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            const parsedFeedback = JSON.parse(feedbackText);
            if (!isFeedback(parsedFeedback)) {
                const errorMessage = typeof parsedFeedback?.error === 'string'
                    ? parsedFeedback.error
                    : 'AI response did not match the expected resume feedback format';
                throw new Error(errorMessage);
            }

            data.feedback = parsedFeedback;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis complete, redirecting...');
            console.log(data);
            navigate(`/resume/${uuid}`);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : typeof error === 'object' && error && 'message' in error
                    ? String(error.message)
                    : 'Something went wrong while analyzing your resume';

            setStatusText(`Error: ${message}`);
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover bg-fixed">
            <Navbar />

            <section className="main-section">
                <div className="page-heading">
                    <p className="rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                        Upload and analyze
                    </p>
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full max-w-md rounded-xl" />
                        </div>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="mt-4 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-200/60 sm:p-6 lg:p-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
