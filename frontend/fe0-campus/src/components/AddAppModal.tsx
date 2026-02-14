import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect } from "react";

const iconOptions = [
    "Bus",
    "FileWarning",
    "LogIn",
    "LogOut",
    "ExternalLink",
    "MessageCircle",
    "Send",
    "Skull",
    "Award",
    "Library",
    "AlertTriangle",
    "Lightbulb",
    "Shield",
    "Key",
    "Home",
];

const categoryOptions = [
    "Academic",
    "Transportation",
    "Student Services",
    "Awareness",
    "Showcase",
    "Resources",
    "Innovation",
    "Facilities",
    "Other",
];

const colorThemes = [
    { name: "Red", color: "bg-red-500", gradient: "from-red-500 to-red-600" },
    { name: "Orange", color: "bg-orange-500", gradient: "from-orange-500 to-orange-600" },
    { name: "Blue", color: "bg-blue-500", gradient: "from-blue-500 to-blue-600" },
    { name: "Green", color: "bg-green-500", gradient: "from-green-500 to-green-600" },
    { name: "Purple", color: "bg-purple-500", gradient: "from-purple-500 to-purple-600" },
    { name: "Yellow", color: "bg-yellow-500", gradient: "from-yellow-500 to-yellow-600" },
    { name: "Pink", color: "bg-pink-500", gradient: "from-pink-500 to-pink-600" },
    { name: "Gray", color: "bg-gray-600", gradient: "from-gray-600 to-gray-700" },
];

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    url: z.string().url("Please enter a valid URL"),
    icon: z.string().min(1, "Please select an icon"),
    category: z.string().min(1, "Please select a category"),
    theme: z.string().min(1, "Please select a color theme"),
    newTab: z.boolean().default(false),
    isenabled: z.boolean().default(true),
});

interface AddAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: any;
}
export function AddAppModal({ isOpen, onClose, onAdd, onDelete, initialData }: AddAppModalProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            url: "",
            icon: "ExternalLink",
            category: "Other",
            theme: "Blue",
            newTab: false,
            isenabled: true,
        },
    });

    const { isSubmitting } = form.formState;

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Find theme name from color class
                const theme = colorThemes.find(t => t.color === initialData.color)?.name || "Blue";

                form.reset({
                    name: initialData.name,
                    description: initialData.description || "",
                    url: initialData.url,
                    icon: initialData.icon,
                    category: initialData.category,
                    theme: theme,
                    newTab: !!initialData.newTab,
                    isenabled: initialData.isenabled !== undefined ? !!initialData.isenabled : true,
                });
            } else {
                form.reset({
                    name: "",
                    description: "",
                    url: "",
                    icon: "ExternalLink",
                    category: "Other",
                    theme: "Blue",
                    newTab: false,
                    isenabled: true,
                });
            }
        }
    }, [isOpen, initialData, form]);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const selectedTheme = colorThemes.find((t) => t.name === values.theme);

        // Generate a simple ID from name only if it's a new app
        const id = initialData?.id || values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const appData = {
            id,
            name: values.name,
            description: values.description || "",
            url: values.url,
            icon: values.icon,
            category: values.category,
            color: selectedTheme?.color || "bg-blue-500",
            gradient: selectedTheme?.gradient || "from-blue-500 to-blue-600",
            newTab: values.newTab,
            isenabled: values.isenabled,
        };

        await onAdd(appData);
        onClose();
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        if (window.confirm("Are you sure you want to delete this app? This action cannot be undone.")) {
            await onDelete(initialData.id);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit App" : "Add New App"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>App Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bus Tracking" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categoryOptions.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of the app"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Icon</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an icon" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {iconOptions.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="theme"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color Theme</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a theme" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {colorThemes.map((theme) => (
                                                    <SelectItem key={theme.name} value={theme.name}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                                                            {theme.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-8 py-2">
                            <FormField
                                control={form.control}
                                name="newTab"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                                        <div className="space-y-0.5">
                                            <FormLabel>Open in New Tab</FormLabel>
                                            <FormDescription>
                                                Open external link in new tab provided by browser
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 gap-2">
                            {/* Left: Delete button (only in edit mode) */}
                            <div>
                                {initialData && onDelete && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                            {/* Right: Cancel and Save Changes */}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {initialData ? "Save Changes" : "Add App"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
