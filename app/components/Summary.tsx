import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";

const Category = ({ title, score }: { title: string, score: number}) => {
    const textColor = score > 70 ? 'text-green-600'
        : score > 49
    ? 'text-yellow-600' : 'text-red-600'

    return(
        <div className="resume-summary">
            <div className = "category">
                <div className="flex min-w-0 flex-row items-center justify-center gap-2">
                    <p className="text-base font-semibold text-slate-800 sm:text-lg">{title}</p>
                    <ScoreBadge score={score} />
                </div>
                <p className = "text-lg font-semibold sm:text-xl">
                    <span className={textColor}>
                        {score}
                    </span>/100
                </p>
            </div>
        </div>
    )
}

const Summary = ({ feedback } : { feedback: Feedback }) => {
    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:text-left">
                <ScoreGauge  score={feedback.overallScore} />

                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold !text-slate-950">Your Resume Score</h2>
                    <p className="text-sm text-slate-500">
                        This score is calculated from the categories below.
                    </p>
                </div>
            </div>

            <Category title="Tone & Style" score={feedback.toneAndStyle.score}/>
            <Category title="Content" score={feedback.content.score}/>
            <Category title="Structure" score={feedback.structure.score}/>
            <Category title="Skills" score={feedback.skills.score}/>

        </div>
    )
}
export default Summary;
