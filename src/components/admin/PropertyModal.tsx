import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import PropertyForm from './PropertyForm'
import { PropertyFormData } from '@/lib/validations/property'
import { FileWithLabel } from './FileUpload'

interface PropertyModalProps {
  isOpen: boolean
  onClose: () => void
  property?: any
  onSave: (data: PropertyFormData & { images: string[]; files: FileWithLabel[] }) => Promise<void>
}

export default function PropertyModal({
  isOpen,
  onClose,
  property,
  onSave,
}: PropertyModalProps) {
  const handleSave = async (data: PropertyFormData & { images: string[]; files: FileWithLabel[] }) => {
    await onSave(data)
    // Don't close here - let AdminDashboard handle it after successful save
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-graphite"
                  >
                    {property ? 'Edit Property' : 'Add New Property'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  <PropertyForm
                    property={property}
                    onSave={handleSave}
                    onCancel={onClose}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

