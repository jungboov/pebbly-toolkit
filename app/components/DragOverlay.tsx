import { motion, AnimatePresence } from 'framer-motion';

interface DragOverlayProps {
  isDragging: boolean;
}

export function DragOverlay({ isDragging }: DragOverlayProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-green-500/20 backdrop-blur-md border-4 border-dashed border-[#00ff00] m-6 rounded-3xl flex items-center justify-center pointer-events-none"
        >
          <div className="text-black text-3xl font-black uppercase tracking-widest bg-[#00ff00] px-8 py-4 rounded-none shadow-[10px_10px_0px_rgba(0,0,0,0.5)]">
            Drop Images to Process
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
