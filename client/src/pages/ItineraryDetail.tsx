import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itineraryAPI } from '../utils/api';
import MapView from '../components/MapView';
import TravelSuggestionBox from '../components/TravelSuggestionBox';
import { useTravelSuggestions } from '../hooks/useTravelSuggestions';
import './ItineraryDetail.css';

interface Attraction {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  visit_date: string | null;
  visit_time: string | null;
  image: string | null;
}

interface Itinerary {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  attractions: Attraction[];
}

function ItineraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditCover, setShowEditCover] = useState(false);
  const [newCoverImage, setNewCoverImage] = useState('');
  const [newAttraction, setNewAttraction] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    visit_date: '',
    visit_time: '',
    image: '',
  });

  // AI 旅游建议
  const attractionSuggestions = useTravelSuggestions(newAttraction.name);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (id) {
      fetchItinerary();
    }
  }, [id, navigate]);

  const fetchItinerary = async () => {
    if (!id) return;
    try {
      const response = await itineraryAPI.getById(parseInt(id));
      setItinerary(response.data);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await itineraryAPI.addAttraction(parseInt(id), {
        name: newAttraction.name,
        description: newAttraction.description || undefined,
        latitude: parseFloat(newAttraction.latitude),
        longitude: parseFloat(newAttraction.longitude),
        address: newAttraction.address || undefined,
        visit_date: newAttraction.visit_date || undefined,
        visit_time: newAttraction.visit_time || undefined,
        image: newAttraction.image || undefined,
      });
      setNewAttraction({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        address: '',
        visit_date: '',
        visit_time: '',
        image: '',
      });
      setShowAddForm(false);
      fetchItinerary();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add attraction');
    }
  };

  const handleDeleteAttraction = async (attractionId: number) => {
    if (!id || !window.confirm('Are you sure you want to delete this attraction?')) return;
    try {
      await itineraryAPI.deleteAttraction(parseInt(id), attractionId);
      fetchItinerary();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete attraction');
    }
  };

  const handleUpdateCoverImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await itineraryAPI.update(parseInt(id), {
        cover_image: newCoverImage || undefined,
      });
      setNewCoverImage('');
      setShowEditCover(false);
      fetchItinerary();
    } catch (error: any) {
      alert(error.response?.data?.error || '更新封面照片失败');
    }
  };

  if (loading) {
    return <div className="detail-loading">Loading...</div>;
  }

  if (!itinerary) {
    return <div className="detail-error">Itinerary not found</div>;
  }

  return (
    <div className="itinerary-detail">
      <header className="detail-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>{itinerary.title}</h1>
      </header>

      <div className="detail-content">
        <div className="detail-cover-wrapper">
          {itinerary.cover_image ? (
            <div className="detail-cover">
              <img src={itinerary.cover_image} alt={itinerary.title} />
              <button
                onClick={() => {
                  setNewCoverImage(itinerary.cover_image || '');
                  setShowEditCover(!showEditCover);
                }}
                className="edit-cover-btn"
                title="更改封面照片"
              >
                📷 更改封面
              </button>
            </div>
          ) : (
            <div className="detail-cover-placeholder">
              <p>暂无封面照片</p>
              <button
                onClick={() => setShowEditCover(!showEditCover)}
                className="add-cover-btn"
              >
                + 添加封面照片
              </button>
            </div>
          )}
          {showEditCover && (
            <form onSubmit={handleUpdateCoverImage} className="edit-cover-form">
              <input
                type="url"
                placeholder="封面照片 URL"
                value={newCoverImage}
                onChange={(e) => setNewCoverImage(e.target.value)}
                className="cover-image-input"
              />
              <div className="cover-form-actions">
                <button type="submit" className="save-cover-btn">
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCover(false);
                    setNewCoverImage('');
                  }}
                  className="cancel-cover-btn"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>

        {itinerary.description && (
          <div className="detail-description">
            <p>{itinerary.description}</p>
          </div>
        )}

        <div className="detail-actions">
          <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
            {showAddForm ? 'Cancel' : '+ Add Attraction'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddAttraction} className="add-attraction-form">
            <div className="input-with-suggestion">
              <input
                type="text"
                placeholder="Attraction Name * (例如: 埃菲尔铁塔, 东京塔, 大本钟)"
                value={newAttraction.name}
                onChange={(e) => setNewAttraction({ ...newAttraction, name: e.target.value })}
                required
              />
              <TravelSuggestionBox
                suggestion={attractionSuggestions.content}
                loading={attractionSuggestions.loading}
                error={attractionSuggestions.error}
              />
            </div>
            <textarea
              placeholder="Description (optional)"
              value={newAttraction.description}
              onChange={(e) => setNewAttraction({ ...newAttraction, description: e.target.value })}
              rows={3}
            />
            <div className="form-row">
              <input
                type="number"
                step="any"
                placeholder="Latitude *"
                value={newAttraction.latitude}
                onChange={(e) => setNewAttraction({ ...newAttraction, latitude: e.target.value })}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude *"
                value={newAttraction.longitude}
                onChange={(e) => setNewAttraction({ ...newAttraction, longitude: e.target.value })}
                required
              />
            </div>
            <input
              type="text"
              placeholder="Address (optional)"
              value={newAttraction.address}
              onChange={(e) => setNewAttraction({ ...newAttraction, address: e.target.value })}
            />
            <div className="form-row">
              <input
                type="date"
                placeholder="Visit Date (optional)"
                value={newAttraction.visit_date}
                onChange={(e) => setNewAttraction({ ...newAttraction, visit_date: e.target.value })}
              />
              <input
                type="time"
                placeholder="Visit Time (optional)"
                value={newAttraction.visit_time}
                onChange={(e) => setNewAttraction({ ...newAttraction, visit_time: e.target.value })}
              />
            </div>
            <input
              type="url"
              placeholder="图片 URL (可选)"
              value={newAttraction.image}
              onChange={(e) => setNewAttraction({ ...newAttraction, image: e.target.value })}
            />
            <button type="submit" className="submit-btn">Add Attraction</button>
          </form>
        )}

        <div className="attractions-section">
          <h2>Attractions ({itinerary.attractions.length})</h2>
          {itinerary.attractions.length === 0 ? (
            <div className="empty-attractions">
              <p>No attractions yet. Add your first one!</p>
            </div>
          ) : (
            <div className="attractions-list">
              {itinerary.attractions.map((attraction) => (
                <div key={attraction.id} className="attraction-item">
                  {attraction.image && (
                    <div className="attraction-image">
                      <img src={attraction.image} alt={attraction.name} />
                    </div>
                  )}
                  <div className="attraction-info">
                    <h3>{attraction.name}</h3>
                    {attraction.description && <p>{attraction.description}</p>}
                    {attraction.address && <p className="address">📍 {attraction.address}</p>}
                    <p className="coordinates">
                      📍 {attraction.latitude.toFixed(6)}, {attraction.longitude.toFixed(6)}
                    </p>
                    {(attraction.visit_date || attraction.visit_time) && (
                      <p className="visit-time">
                        🕐 {attraction.visit_date || ''} {attraction.visit_time || ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAttraction(attraction.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {itinerary.attractions.length > 0 && (
          <div className="map-section">
            <h2>Map View</h2>
            <MapView attractions={itinerary.attractions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ItineraryDetail;


