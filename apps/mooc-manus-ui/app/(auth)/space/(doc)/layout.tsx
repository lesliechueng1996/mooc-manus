import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

const DocLayout = ({ children }: Props) => {
  return <div className="p-3 h-full">{children}</div>;
};

export default DocLayout;
