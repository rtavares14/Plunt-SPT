import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { NOTE_BG, type QuestionSummary } from '../api/questions';

interface QuestionCardProps {
  question: QuestionSummary;
  onDelete?: (question: QuestionSummary) => void;
}

function QuestionCard({ question, onDelete }: QuestionCardProps) {
  return (
    <div
      className={`group relative flex flex-col min-h-[14rem] p-5 pt-7 rounded-sm shadow-md ${NOTE_BG[question.color]} -rotate-1 hover:rotate-0 transition-transform`}
    >
      {/* tape */}
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-cream-soft/60 border border-olive-main/10 rotate-1" />

      {onDelete ? (
        <IconButton
          aria-label="Delete question"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(question);
          }}
          className="!absolute !top-2 !right-2 !z-10 !bg-cream-soft/80 !text-accent-clay hover:!bg-cream-soft"
          size="small"
        >
          <DeleteOutlineIcon className="!text-xl" />
        </IconButton>
      ) : null}

      {question.title ? (
        <Typography className="!text-olive-main !text-xl !font-semibold !leading-tight !mb-1.5">
          {question.title}
        </Typography>
      ) : null}

      <p className="text-olive-main text-lg leading-snug flex-1 whitespace-pre-line break-words">
        {question.body}
      </p>

      {question.resolved ? (
        <span className="flex items-center gap-1 text-olive-main/70 text-base mt-3">
          <CheckCircleOutlineIcon className="!text-lg" />
          Resolved
        </span>
      ) : null}
    </div>
  );
}

export default QuestionCard;
