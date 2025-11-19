// 'use client';

// import { Settings } from 'lucide-react';
// import type { ComponentProps } from 'react';
// import { useState } from 'react';
// import { toast } from 'sonner';
// import { getApiToolProviderAction } from '@/actions/api-tool-action';
// import LoadingButton from '@/components/LoadingButton';
// import { Separator } from '@/components/ui/separator';
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
// } from '@/components/ui/sheet';
// import useModal from '@/hooks/useModal';
// import { EDIT_API_TOOL } from '@/lib/modal-name';
// import { getActionErrorMsg } from '@/lib/utils';
// import type { GetApiToolProviderRes } from '@/schemas/api-tool-schema';
// import ToolSheetCard from '../../../_components/ToolSheetCard';
// import ApiToolCardHeader from './ApiToolCardHeader';
// import EditToolModal from './EditToolModal';

// type ToolProp = ComponentProps<typeof ToolSheetCard>;

// type Props = {
//   providerId: string;
//   isOpen: boolean;
//   setIsOpen: (value: boolean) => void;
//   description: string;
//   tools: ToolProp[];
// } & ComponentProps<typeof ApiToolCardHeader>;

// const ApiToolSheet = ({
//   providerId,
//   isOpen,
//   setIsOpen,
//   description,
//   tools,
//   ...headerProps
// }: Props) => {
//   const [isEditButtonLoading, setIsEditButtonLoading] = useState(false);
//   const [editProvider, setEditProvider] =
//     useState<GetApiToolProviderRes | null>(null);
//   const { openModal } = useModal();

//   const handleEdit = async () => {
//     setIsEditButtonLoading(true);
//     try {
//       const res = await getApiToolProviderAction({
//         providerId,
//       });
//       if (!res?.data) {
//         toast.error(getActionErrorMsg(res, '获取自定义插件信息失败'));
//         return;
//       }
//       setEditProvider(res.data);
//       openModal(EDIT_API_TOOL);
//     } catch (_error) {
//       toast.error('获取自定义插件信息失败');
//     } finally {
//       setIsEditButtonLoading(false);
//     }
//   };

//   return (
//     <>
//       <Sheet open={isOpen} onOpenChange={setIsOpen}>
//         <SheetContent aria-describedby={undefined}>
//           <SheetHeader>
//             <SheetTitle>Tool Details</SheetTitle>
//           </SheetHeader>

//           <Separator className="mb-4" />

//           <div className="px-8">
//             <div className="space-y-4">
//               <div className="space-y-3">
//                 <ApiToolCardHeader {...headerProps} />
//                 <p className="text-sm text-muted-foreground">{description}</p>
//               </div>
//               <LoadingButton
//                 text="Edit"
//                 icon={<Settings />}
//                 className="w-full"
//                 variant="outline"
//                 onClick={handleEdit}
//                 isLoading={isEditButtonLoading}
//               />
//             </div>

//             <Separator className="mt-3 mb-4" />

//             <div>
//               <h3 className="text-xs text-muted-foreground mb-3">
//                 Contains {headerProps.toolCount} tools
//               </h3>
//               <div className="space-y-2 overflow-y-auto h-full no-scrollbar">
//                 {tools.map((tool) => (
//                   <ToolSheetCard key={tool.label} {...tool} />
//                 ))}
//               </div>
//             </div>
//           </div>
//         </SheetContent>
//       </Sheet>
//       <EditToolModal
//         providerId={providerId}
//         defaultValues={editProvider}
//         onClose={() => setEditProvider(null)}
//       />
//     </>
//   );
// };

// export default ApiToolSheet;
