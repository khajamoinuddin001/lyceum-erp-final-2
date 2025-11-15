
import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { LmsCourse } from '../types';

interface CourseEditModalProps {
  course: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse | 'new' | null;
  onClose: () => void;
  onSave: (courseData: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse) => void;
}

export const CourseEditModal: React.FC<CourseEditModalProps> = ({ course, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const isNew = course === 'new' || !course || !('id' in course);

  useEffect(() => {
    if (course && course !== 'new') {
      setTitle(course.title || '');
      setDescription(course.description || '');
      setInstructor(course.instructor || '');
      setPrice(course.price !== undefined ? String(course.price) : '');
    } else {
      setTitle('');
      setDescription('');
      setInstructor('');
      setPrice('');
    }
    setError('');
  }, [course]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };
  
  const handleSave = () => {
    if (!title.trim() || !description.trim() || !instructor.trim()) {
        setError('Title, description, and instructor are required.');
        return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
        setError('Please enter a valid, non-negative price.');
        return;
    }

    const courseData = {
        title: title.trim(),
        description: description.trim(),
        instructor: instructor.trim(),
        price: priceValue,
    };
    
    if (!isNew && course && 'id' in course) {
        onSave({ ...course, ...courseData });
    } else {
        onSave(courseData);
    }
  };
  
  if (!course) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
  const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';
  
  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-edit-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="course-edit-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isNew ? 'Create New Course' : 'Edit Course'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
            <div>
                <label htmlFor="course-title" className={labelClasses}>Course Title</label>
                <input id="course-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} placeholder="e.g., Introduction to React"/>
            </div>
             <div>
                <label htmlFor="course-description" className={labelClasses}>Description</label>
                <textarea id="course-description" rows={4} value={description} onChange={e => setDescription(e.target.value)} className={inputClasses} placeholder="A short summary of the course content."/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="course-instructor" className={labelClasses}>Instructor</label>
                    <input id="course-instructor" type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className={inputClasses} placeholder="e.g., Jane Doe"/>
                </div>
                 <div>
                    <label htmlFor="course-price" className={labelClasses}>Price (₹)</label>
                    <input id="course-price" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className={inputClasses} placeholder="e.g., 4999"/>
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark"
          >
            {isNew ? 'Create Course' : 'Save Changes'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out-fast { from { opacity: 1; } to { opacity: 0; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        .animate-fade-out-fast { animation: fade-out-fast 0.2s ease-in forwards; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes scale-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-scale-out { animation: scale-out 0.2s ease-in forwards; }
      `}</style>
    </div>
  );
};
