import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog.jsx";
import { cn } from "../../lib/cn.js";

const sideClasses = {
  top: "inset-x-0 top-0 rounded-b-lg",
  right: "inset-y-0 right-0 h-full max-w-md rounded-l-lg",
  bottom: "inset-x-0 bottom-0 rounded-t-lg",
  left: "inset-y-0 left-0 h-full max-w-md rounded-r-lg",
};

export { DialogClose as SheetClose, DialogDescription as SheetDescription, DialogFooter as SheetFooter, DialogHeader as SheetHeader, DialogTitle as SheetTitle, DialogTrigger as SheetTrigger };

export function Sheet(props) {
  return <Dialog {...props} />;
}

export function SheetContent({ children, className, side = "right", ...props }) {
  return (
    <DialogContent
      className={cn("fixed m-0 w-full max-w-md border bg-background p-6 shadow-lg", sideClasses[side], className)}
      showClose={false}
      {...props}
    >
      {children}
    </DialogContent>
  );
}
