import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { PlayCircle, FileText, CheckCircle2, Search, X, Loader2, ShieldCheck } from 'lucide-react';

export function AddResource() {
  const { addToast } = useUI();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('youtube');
  const [isPremium, setIsPremium] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [metaData, setMetaData] = useState<any>(null);

  // Topics
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<any[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch available topics
    const fetchTopics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('http://localhost:8000/api/topics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableTopics(data.topics || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTopics();
  }, []);

  // Handle click outside topic dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTopicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (newUrl.includes('youtube.com/watch') || newUrl.includes('youtu.be/')) {
      setIsFetchingMeta(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`http://localhost:8000/api/v1/utils/youtube-meta?url=${encodeURIComponent(newUrl)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetaData(data);
          if (!title) {
            setTitle(data.title);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsFetchingMeta(false);
      }
    } else {
      setMetaData(null);
    }
  };

  const toggleTopic = (topic: any) => {
    if (selectedTopics.some(t => t.id === topic.id)) {
      setSelectedTopics(selectedTopics.filter(t => t.id !== topic.id));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
    setTopicSearch('');
    setIsTopicDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!url || !title) {
      addToast('URL and Title are required', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      // 1. Create Resource
      const resourcePayload = {
        title: title,
        resource_type: resourceType,
        data: { url, thumbnail_url: metaData?.thumbnail_url },
        is_premium: isPremium,
        is_active: true
      };

      const resResponse = await fetch('http://localhost:8000/api/study-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resourcePayload)
      });

      if (!resResponse.ok) {
        addToast('Failed to create resource', 'error');
        return;
      }

      const resData = await resResponse.json();
      const resourceId = resData.id;

      // 2. Create Mappings
      if (selectedTopics.length > 0) {
        const mappingPayload = {
          resource_id: resourceId,
          topic_ids: selectedTopics.map(t => t.id)
        };

        const mapResponse = await fetch('http://localhost:8000/api/study-resource-mapping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mappingPayload)
        });

        if (!mapResponse.ok) {
          addToast('Resource created, but failed to map topics', 'warning');
        }
      }

      addToast('Resource successfully created!', 'success');
      // Clear form
      setUrl('');
      setTitle('');
      setMetaData(null);
      setSelectedTopics([]);
      setIsPremium(false);
      setResourceType('youtube');

    } catch (e) {
      console.error(e);
      addToast('An error occurred while saving', 'error');
    }
  };

  const uniqueSubjects = Array.from(new Set(availableTopics.map(t => t.subject).filter(Boolean)));

  const filteredTopics = availableTopics.filter(t => {
    const matchesSearch = t.tag.toLowerCase().includes(topicSearch.toLowerCase()) || 
                          (t.subject && t.subject.toLowerCase().includes(topicSearch.toLowerCase()));
    const matchesSubject = selectedSubjectFilter ? t.subject === selectedSubjectFilter : true;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-slate-50/50">
      
      {/* Left Pane - Input Form */}
      <div className="w-full lg:w-3/5 overflow-y-auto p-6 md:p-8 lg:p-12 border-r border-slate-200 bg-white">
        
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add Learning Resource</h1>
            <p className="text-slate-500 mt-2 text-sm">Add videos, PDFs, or articles to the platform syllabus.</p>
          </div>

          <div className="space-y-8">
            {/* Step 1: The Source */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Resource URL</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#003fb1]/20 focus:border-[#003fb1] outline-none text-slate-700 transition-all shadow-sm"
                value={url}
                onChange={handleUrlChange}
              />
              {isFetchingMeta && (
                <div className="flex items-center gap-2 mt-3 text-sm text-blue-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching details from YouTube...
                </div>
              )}
            </div>

            {/* Step 2: Basic Details */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter resource title"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#003fb1]/20 focus:border-[#003fb1] outline-none text-slate-700 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Resource Type</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#003fb1]/20 focus:border-[#003fb1] outline-none text-slate-700 transition-all bg-white"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                >
                  <option value="youtube">YouTube Video</option>
                  <option value="pdf" disabled>PDF Document (Coming Soon)</option>
                  <option value="article" disabled>Text Article (Coming Soon)</option>
                </select>
              </div>
            </div>

            {/* Step 3: Taxonomy */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Linked Topics (Syllabus Mapping)</label>
              <div className="relative" ref={dropdownRef}>
                <div className="min-h-[46px] p-1.5 border border-slate-200 rounded-lg bg-white flex items-center focus-within:ring-2 focus-within:ring-[#003fb1]/20 focus-within:border-[#003fb1] transition-all">
                  <div className="flex-1 w-full flex items-center gap-2 px-2">
                    <select 
                      className="text-sm outline-none bg-transparent text-slate-700 font-medium py-1.5 min-w-[120px] cursor-pointer"
                      value={selectedSubjectFilter}
                      onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                    >
                      <option value="">All Subjects</option>
                      {uniqueSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    
                    <Search className="w-4 h-4 text-slate-400 ml-1" />
                    <input
                      type="text"
                      className="flex-1 py-1.5 outline-none bg-transparent text-sm text-slate-700"
                      placeholder="Search and select topics..."
                      value={topicSearch}
                      onChange={(e) => {
                        setTopicSearch(e.target.value);
                        setIsTopicDropdownOpen(true);
                      }}
                      onFocus={() => setIsTopicDropdownOpen(true)}
                    />
                  </div>
                </div>

                {selectedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTopics.map(topic => (
                      <span key={topic.id} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium border border-indigo-100">
                        {topic.tag}
                        <button onClick={() => toggleTopic(topic)} className="hover:bg-indigo-200/50 rounded-full p-0.5 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {isTopicDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/40 py-1">
                    {filteredTopics.length > 0 ? (
                      filteredTopics.map(topic => {
                        const isSelected = selectedTopics.some(t => t.id === topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => toggleTopic(topic)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                          >
                            <div>
                              <span className="font-medium text-slate-700">{topic.tag}</span>
                              {topic.subject && <span className="ml-2 text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">{topic.subject}</span>}
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">No matching topics found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Access Control */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Premium Content
                </h4>
                <p className="text-sm text-amber-700/80 mt-1">Require a paid subscription to view this resource.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isPremium}
                  onChange={() => setIsPremium(!isPremium)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Action Bar */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setUrl(''); setTitle(''); setMetaData(null); setSelectedTopics([]); setIsPremium(false);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#003fb1] hover:bg-[#003fb1]/90 rounded-lg transition-colors shadow-sm shadow-blue-900/20 flex items-center gap-2"
              >
                Save Resource
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Right Pane - Preview */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#f8fafc] border-l border-slate-200 p-8 flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-40 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-40 -ml-20 -mb-20"></div>
        
        <div className="w-full max-w-sm relative z-10">
          <div className="mb-6 text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Student Preview</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60">
            {/* Thumbnail Area */}
            <div className="aspect-video bg-slate-100 relative group overflow-hidden">
              {metaData?.thumbnail_url ? (
                <>
                  <img src={metaData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  {resourceType === 'youtube' ? <PlayCircle className="w-12 h-12" /> : <FileText className="w-12 h-12" />}
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                  {resourceType === 'youtube' ? 'VIDEO' : resourceType.toUpperCase()}
                </span>
                {isPremium && (
                  <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> PREMIUM
                  </span>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5">
              <h3 className="font-bold text-slate-900 leading-tight line-clamp-2 min-h-[2.5rem]">
                {title || 'Resource Title Will Appear Here'}
              </h3>
              
              {metaData?.author_name && (
                <p className="text-xs text-slate-500 mt-2 font-medium">{metaData.author_name}</p>
              )}

              {/* Tag Pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedTopics.length > 0 ? (
                  selectedTopics.map(t => (
                    <span key={t.id} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {t.tag}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-300 px-2 py-0.5 rounded">Topic Tag</span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-300 px-2 py-0.5 rounded">Subject</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {!url && (
            <p className="text-center text-sm text-slate-400 mt-8 font-medium">
              Paste a URL on the left to see the live preview.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
