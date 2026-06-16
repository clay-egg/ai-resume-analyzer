import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if(!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card group animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex min-w-0 flex-col gap-1">
                    {companyName && <h2 className="!text-slate-950 font-bold break-words text-2xl">{companyName}</h2>}
                    {jobTitle && <h3 className="text-base break-words text-slate-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>
            {resumeUrl && (
                <div className="gradient-border animate-in fade-in duration-1000 overflow-hidden">
                    <div className="w-full overflow-hidden rounded-xl bg-slate-100">
                        <img
                            src={resumeUrl}
                            alt="resume"
                            className="h-[300px] w-full object-cover object-top transition duration-500 group-hover:scale-[1.02] sm:h-[360px]"
                        />
                    </div>
                </div>
            )}
        </Link>
    )
}
export default ResumeCard
