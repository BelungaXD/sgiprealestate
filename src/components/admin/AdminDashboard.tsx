import { useState, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import PropertyModal from './PropertyModal'
import FolderImport from './FolderImport'
import { PropertyFormData } from '@/lib/validations/property'
import { FileWithLabel } from './FileUpload'

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { t } = useTranslation('admin')
  const [activeTab, setActiveTab] = useState('properties')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    views: 0,
    leads: 0,
  })

  // Load properties from API
  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties?limit=100')
      const data = await response.json()
      
      if (data.properties) {
        setProperties(data.properties)
        setStats({
          total: data.total || 0,
          active: data.properties.filter((p: any) => p.status === 'AVAILABLE').length,
          views: 0, // TODO: Add views tracking
          leads: 0, // TODO: Add leads tracking
        })
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    { name: t('dashboard.totalProperties'), value: stats.total.toString(), icon: BuildingOfficeIcon, color: 'text-blue-600' },
    { name: t('dashboard.activeListings'), value: stats.active.toString(), icon: HomeIcon, color: 'text-green-600' },
    { name: t('dashboard.totalViews'), value: stats.views.toString(), icon: EyeIcon, color: 'text-purple-600' },
    { name: t('dashboard.leads'), value: stats.leads.toString(), icon: UsersIcon, color: 'text-champagne' }
  ]

  const handleAddProperty = () => {
    setEditingProperty(null)
    setIsModalOpen(true)
  }

  const handleEditProperty = async (property: any) => {
    try {
      // Load full property data with all images and files
      const response = await fetch(`/api/properties/${property.id}`)
      if (response.ok) {
        const data = await response.json()
        setEditingProperty(data.property)
      } else {
        // Fallback to property from list if API fails
        setEditingProperty(property)
      }
    } catch (error) {
      console.error('Error loading property details:', error)
      // Fallback to property from list if API fails
    setEditingProperty(property)
    }
    setIsModalOpen(true)
  }

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadProperties()
      } else {
        alert('Error deleting property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Error deleting property')
    }
  }

  const handleDeleteAllProperties = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL properties? This action cannot be undone!')) {
      return
    }

    if (!confirm('Do you really want to delete all properties? Click OK to confirm.')) {
      return
    }

    try {
      const response = await fetch('/api/properties/delete-all', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(`Deleted ${result.count} properties`)
        await loadProperties()
      } else {
        alert(result.message || 'Error deleting properties')
      }
    } catch (error) {
      console.error('Error deleting properties:', error)
      alert('Error deleting properties')
    }
  }

  const handleSaveProperty = async (data: PropertyFormData & { images: string[]; files: FileWithLabel[] }) => {
    try {
      const url = editingProperty
        ? `/api/properties/${editingProperty.id}`
        : '/api/properties'
      
      const method = editingProperty ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        // Try to parse JSON error, but handle HTML responses
        let errorMessage = 'Error saving property'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.message || error.errors?.[0]?.message || errorMessage
          } else {
            // If response is HTML (like error page), get status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      const contentType = response.headers.get('content-type')
      let result: any = {}
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
        // Handle both success: true/false formats
        if (result.success === false) {
          throw new Error(result.message || 'Error saving property')
        }
        // Log demo mode silently (database may be temporarily unavailable)
        if (result.message && result.message.includes('demo mode') && result.message.includes('database not configured')) {
          console.warn('Database temporarily unavailable, property saved in demo mode:', result.message)
        }
      }

      // Reload properties to show the new one
      await loadProperties()
      
      // Check if property was actually saved (has real ID, not demo)
      const isDemoMode = result.message && result.message.includes('demo mode')
      const isRealProperty = result.property && result.property.id && !result.property.id.startsWith('demo-')
      
      if (isDemoMode) {
        // In demo mode, property is not saved to database
        // Don't close modal - user needs to configure database
        console.warn('Property not saved - database not configured')
      } else if (isRealProperty || response.ok) {
        // Property was saved successfully
        setIsModalOpen(false)
        setEditingProperty(null)
      } else {
        // Unknown state - close modal anyway
        setIsModalOpen(false)
        setEditingProperty(null)
      }
    } catch (error: any) {
      console.error('Error saving property:', error)
      alert(error.message || 'Error saving property')
      throw error
    }
  }

  const tabs = [
    { id: 'properties', name: t('dashboard.properties'), icon: BuildingOfficeIcon },
    { id: 'leads', name: t('dashboard.leads'), icon: UsersIcon },
    { id: 'analytics', name: t('dashboard.analytics'), icon: ChartBarIcon }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-champagne rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-graphite">{t('dashboard.title')}</h1>
                <p className="text-sm text-gray-600">{t('dashboard.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span>{t('dashboard.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === tab.id ? 'bg-champagne/10 text-champagne border-r-2 border-champagne' : 'text-gray-700'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-graphite">{stat.value}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              {/* Folder Import Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <FolderImport onImportComplete={loadProperties} />
                <div className="mt-6 flex items-center justify-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleAddProperty}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>{t('properties.addProperty')}</span>
                  </button>
                </div>
              </div>
              
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-graphite">{t('properties.title')}</h2>
                  <div className="flex items-center space-x-2">
                    {properties.length > 0 && (
                      <button
                        onClick={handleDeleteAllProperties}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        title="Delete all properties"
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : properties.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{t('properties.noProperties')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.property')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.price')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.views')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-graphite">{property.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {property.currency} {property.price.toLocaleString('en-US')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              property.status === 'AVAILABLE' 
                                ? 'bg-green-100 text-green-800' 
                                : property.status === 'SOLD'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {property.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.views || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditProperty(property)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(property.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-graphite mb-4">{t('leads.title')}</h2>
              <p className="text-gray-600">{t('leads.comingSoon')}</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-graphite mb-4">{t('analytics.title')}</h2>
              <p className="text-gray-600">{t('analytics.comingSoon')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Modal */}
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProperty(null)
        }}
        property={editingProperty}
        onSave={handleSaveProperty}
      />
    </div>
  )
}
