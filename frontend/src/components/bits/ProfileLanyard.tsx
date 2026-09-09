import React from 'react';
import { User } from '../../types';
import Lanyard from './Lanyard';

interface ProfileLanyardProps {
  user: User | null;
  onClose?: () => void;
  autoHideDuration?: number;
}

export const ProfileLanyard: React.FC<ProfileLanyardProps> = ({
  user,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[200] bg-[#07090e] select-none overflow-hidden flex items-center justify-center">
      <Lanyard user={user} onClose={onClose} />
    </div>
  );
};
