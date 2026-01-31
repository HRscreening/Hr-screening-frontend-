import { Loader2 } from 'lucide-react';



const Loader = ({text}:{text?:string}) => {
  return (
     <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          {
            text && <p className="text-sm text-muted-foreground">{text}</p>
          }
        </div>
      </div>
  )
}

export default Loader
