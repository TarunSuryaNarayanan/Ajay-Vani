import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export const MobileContainer: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#ECEEEA] flex justify-center items-start sm:py-6">
      <div className="w-full max-w-[480px] min-h-screen sm:min-h-[844px] bg-surface flex flex-col relative shadow-sm border-x border-line overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};
