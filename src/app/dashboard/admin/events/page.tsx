'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: ''
  });

  // Show message function
  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 5000);
  };

  // Fetch events
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        showMessage('Failed to fetch events', 'error');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showMessage('Error fetching events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create or update event
  const saveEvent = async () => {
    if (!formData.title || !formData.event_date) {
      showMessage('Title and event date are required', 'error');
      return;
    }

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          is_active: editingEvent ? editingEvent.is_active : true,
          created_by: 'Admin' // You can get this from auth context
        }),
      });

      if (response.ok) {
        showMessage(editingEvent ? 'Event updated successfully!' : 'Event created successfully!', 'success');
        fetchEvents();
        resetForm();
        setIsCreateDialogOpen(false);
        setEditingEvent(null);
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to save event', 'error');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      showMessage('Error saving event', 'error');
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('Event deleted successfully!', 'success');
        fetchEvents();
      } else {
        showMessage('Failed to delete event', 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showMessage('Error deleting event', 'error');
    }
  };

  // Toggle event status
  const toggleEventStatus = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          is_active: !event.is_active
        }),
      });

      if (response.ok) {
        showMessage(`Event ${!event.is_active ? 'activated' : 'deactivated'} successfully!`, 'success');
        fetchEvents();
      } else {
        showMessage('Failed to update event status', 'error');
      }
    } catch (error) {
      console.error('Error toggling event status:', error);
      showMessage('Error updating event status', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      location: ''
    });
  };

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Check if event is upcoming
  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Set form data when editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_date: formatDateForInput(editingEvent.event_date),
        location: editingEvent.location || ''
      });
    }
  }, [editingEvent]);

  return (
    <div className="p-6 space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('error') || message.includes('Failed') || message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
          <button 
            onClick={() => setMessage('')} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Events Management
          </h1>
          <p className="text-gray-600">Manage school events and announcements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEvents} disabled={isLoading}>
            <Calendar className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new event to the school calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="event_date">Date & Time *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Event location"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEvent} className="flex-1">Create Event</Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{events.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => isUpcoming(e.event_date) && e.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Upcoming Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {events.filter(e => !e.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Inactive Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            Manage your school events and their visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading events...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">No events found</div>
              <div className="text-sm text-gray-500 mt-2">Create your first event to get started.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <Badge 
                          className={`${event.is_active 
                            ? (isUpcoming(event.event_date) ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')
                            : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.is_active 
                            ? (isUpcoming(event.event_date) ? 'Upcoming' : 'Past Event')
                            : 'Inactive'
                          }
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-gray-600 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDateForDisplay(event.event_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEventStatus(event)}
                      >
                        {event.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingEvent(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Event</DialogTitle>
                            <DialogDescription>
                              Update the event details
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-title">Title *</Label>
                              <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Event title"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Event description"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-event_date">Date & Time *</Label>
                              <Input
                                id="edit-event_date"
                                type="datetime-local"
                                value={formData.event_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-location">Location</Label>
                              <Input
                                id="edit-location"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Event location"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={saveEvent} className="flex-1">Update Event</Button>
                              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
