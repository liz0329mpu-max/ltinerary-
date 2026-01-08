import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itineraryAPI } from '../utils/api';
import CurrencyConverter from '../components/CurrencyConverter';
import AIAssistant from '../components/AIAssistant';
import TravelSuggestionBox from '../components/TravelSuggestionBox';
import { useTravelSuggestions } from '../hooks/useTravelSuggestions';
import './Dashboard.css';

interface Itinerary {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  created_at: string;
}

function Dashboard() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');
  const navigate = useNavigate();

  // AI 旅游建议
  const titleSuggestions = useTravelSuggestions(newTitle);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchItineraries();
  }, [navigate]);

  const fetchItineraries = async () => {
    try {
      const response = await itineraryAPI.getAll();
      setItineraries(response.data);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await itineraryAPI.create({
        title: newTitle,
        description: newDescription || undefined,
        cover_image: newCoverImage || undefined,
      });
      setNewTitle('');
      setNewDescription('');
      setNewCoverImage('');
      setShowNewForm(false);
      fetchItineraries();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create itinerary');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止点击事件冒泡到卡片
    if (!window.confirm('确定要删除这个行程吗？此操作无法撤销。')) return;
    try {
      await itineraryAPI.delete(id);
      fetchItineraries();
    } catch (error: any) {
      alert(error.response?.data?.error || '删除行程失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Travel Itinerary Planner</h1>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user.username || 'User'}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <CurrencyConverter />
          <AIAssistant />
        </aside>

        <main className="dashboard-main">
          <div className="itineraries-header">
            <h2>My Itineraries</h2>
            <button onClick={() => setShowNewForm(!showNewForm)} className="new-btn">
              {showNewForm ? 'Cancel' : '+ New Itinerary'}
            </button>
          </div>

          {showNewForm && (
            <form onSubmit={handleCreate} className="new-itinerary-form">
              <div className="input-with-suggestion">
                <input
                  type="text"
                  placeholder="Itinerary Title * (例如: 日本东京之旅, 巴黎浪漫之旅)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
                <TravelSuggestionBox
                  suggestion={titleSuggestions.content}
                  loading={titleSuggestions.loading}
                  error={titleSuggestions.error}
                />
              </div>
              <textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
              <input
                type="url"
                placeholder="Cover Image URL (optional)"
                value={newCoverImage}
                onChange={(e) => setNewCoverImage(e.target.value)}
              />
              <button type="submit" className="create-btn">Create Itinerary</button>
            </form>
          )}

          <div className="itineraries-grid">
            {itineraries.length === 0 ? (
              <div className="empty-state">
                <p>No itineraries yet. Create your first one!</p>
              </div>
            ) : (
              itineraries.map((itinerary) => (
                <div
                  key={itinerary.id}
                  className="itinerary-card"
                  onClick={() => navigate(`/itinerary/${itinerary.id}`)}
                >
                  {itinerary.cover_image && (
                    <div className="itinerary-cover">
                      <img src={itinerary.cover_image} alt={itinerary.title} />
                    </div>
                  )}
                  <div className="itinerary-content">
                    <div className="itinerary-header">
                      <h3>{itinerary.title}</h3>
                      <button
                        onClick={(e) => handleDelete(itinerary.id, e)}
                        className="delete-itinerary-btn"
                        title="删除行程"
                      >
                        🗑️
                      </button>
                    </div>
                    {itinerary.description && <p>{itinerary.description}</p>}
                    {itinerary.start_date && (
                      <div className="itinerary-dates">
                        {itinerary.start_date}
                        {itinerary.end_date && ` - ${itinerary.end_date}`}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;


