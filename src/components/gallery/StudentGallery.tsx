'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Users, Star, Camera } from 'lucide-react';

interface GalleryItem {
  id: string;
  image_url: string;
  alt?: string;
  title: string;
  category: 'prefects' | 'students' | 'events' | 'school';
  description?: string;
}

export default function StudentGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = selectedCategory && selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
        const res = await fetch(`/api/gallery${q}`);
        const data = await res.json();
        const fallback: GalleryItem[] = [
          { id: 'g1', image_url: '/images/gallery/prefects-1.jpg', alt: 'Head Boy', title: 'Head Boy', category: 'prefects', description: 'Our head boy representing excellence and responsibility' },
          { id: 'g2', image_url: '/images/gallery/students-1.jpg', alt: 'Students in classroom', title: 'Active Learning Environment', category: 'students', description: 'Students engaged in interactive learning' },
          { id: 'g3', image_url: '/images/gallery/school-building.jpg', alt: 'School Building', title: 'School Building', category: 'school', description: 'Our campus and facilities' }
        ];
        const incoming = (data.images || []) as GalleryItem[];
        setItems(incoming.length ? incoming : fallback);
      } catch {}
      setLoading(false);
    };
    load();
  }, [selectedCategory]);

const categories = [
  { key: 'all', label: 'All Photos', icon: Camera },
  { key: 'prefects', label: 'Prefects', icon: Star },
  { key: 'students', label: 'Student Life', icon: Users },
  { key: 'events', label: 'Events', icon: Camera },
  { key: 'school', label: 'School', icon: Users }
];

  const filteredItems = items;

  const openModal = (item: GalleryItem) => {
    setSelectedImage(item);
    setImageError(false);
    setCurrentImageIndex(filteredItems.findIndex(i => i.id === item.id));
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredItems.length - 1;
    } else {
      newIndex = currentImageIndex < filteredItems.length - 1 ? currentImageIndex + 1 : 0;
    }
    
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredItems[newIndex]);
  };

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Student Community
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the vibrant life at Yano School through the eyes of our students, 
            prefects, and the memorable moments that shape our community.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                  ${selectedCategory === category.key
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="group cursor-pointer"
                onClick={() => openModal(item)}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <Image
                    src={item.image_url}
                    alt={item.alt || item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                    <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </div>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`
                      px-2 py-1 text-xs rounded-full text-white font-medium
                      ${item.category === 'prefects' ? 'bg-red-500' : 
                        item.category === 'students' ? 'bg-blue-500' : 
                        item.category === 'events' ? 'bg-green-500' : 'bg-purple-500'}
                    `}>
                      {categories.find(c => c.key === item.category)?.label || item.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No items message */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No photos found in this category.</p>
          </div>
        )}
        {loading && (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Navigation buttons */}
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image */}
              <div className="relative w-[80vw] max-w-2xl aspect-square max-h-[80vh] flex items-center justify-center bg-black/20">
                {imageError ? (
                  <div className="text-center text-white p-6">
                    <p className="text-lg font-semibold">Unable to load image</p>
                    <p className="text-sm text-gray-300 mt-2">{selectedImage.title}</p>
                  </div>
                ) : (
                  <Image
                    src={selectedImage.image_url}
                    alt={selectedImage.alt || selectedImage.title}
                    fill
                    className="object-contain"
                    sizes="80vw"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>

              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4">
                <h3 className="text-lg font-semibold mb-1">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-sm text-gray-300">{selectedImage.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {currentImageIndex + 1} of {filteredItems.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
