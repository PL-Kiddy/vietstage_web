import React from 'react';
import { Outlet } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import InstructorTopbar from './InstructorTopbar';

const InstructorLayout = () => {
  return (
    <div className="min-h-screen bg-[#fbf9f4]">
      <InstructorSidebar />
      <InstructorTopbar />
      <main className="md:ml-72 pt-24 px-margin-desktop pb-xl min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default InstructorLayout;
