"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextStyle from "@tiptap/extension-text-style"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import { Extension } from "@tiptap/core"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icone"
import { useEffect, useCallback, useMemo, useState } from "react"

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.setMark("textStyle", { fontSize })
        },
      unsetFontSize:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.setMark("textStyle", { fontSize: null })
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  },
})

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  noInternalScroll?: boolean
}

const ColorPicker = ({
  selectedColor,
  onColorChange,
  onClose,
}: {
  selectedColor: string
  onColorChange: (color: string) => void
  onClose: () => void
}) => {
  const colors = [
    "#000000",
    "#1B1916",
    "#57514A",
    "#8C857C",
    "#CCCCCC",
    "#FF0000",
    "#FF6600",
    "#FFCC00",
    "#33CC33",
    "#0066CC",
    "#6600CC",
    "#CC0066",
    "#FF3366",
    "#FF9933",
    "#FFFF00",
    "#66FF66",
    "#3399FF",
    "#9966FF",
    "#FF6699",
    "#A0A0A0",
  ]

  return (
    <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
      <div className="grid grid-cols-5 gap-1 mb-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform ${
              selectedColor === color ? "ring-2 ring-blue-500" : ""
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            title={color}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onColorChange("")}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Remover
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

const HighlightColorPicker = ({
  selectedColor,
  onColorChange,
  onClose,
}: {
  selectedColor: string
  onColorChange: (color: string) => void
  onClose: () => void
}) => {
  const highlightColors = [
    "#FFFF00",
    "#FFE135",
    "#FFD700",
    "#FFA500",
    "#FF6347",
    "#98FB98",
    "#90EE90",
    "#87CEEB",
    "#DDA0DD",
    "#F0E68C",
    "#FFCCCB",
    "#FFB6C1",
    "#E6E6FA",
    "#D3D3D3",
    "transparent",
  ]

  return (
    <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
      <div className="grid grid-cols-5 gap-1 mb-2">
        {highlightColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform ${
              selectedColor === color ? "ring-2 ring-blue-500" : ""
            }`}
            style={{
              backgroundColor: color === "transparent" ? "white" : color,
              backgroundImage:
                color === "transparent"
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : "none",
              backgroundSize: color === "transparent" ? "8px 8px" : "auto",
              backgroundPosition:
                color === "transparent"
                  ? "0 0, 0 4px, 4px -4px, -4px 0px"
                  : "auto",
            }}
            onClick={() => onColorChange(color)}
            title={color === "transparent" ? "Remover destaque" : color}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onColorChange("")}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Remover
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

const LinkDialog = ({
  isOpen,
  currentUrl,
  onSave,
  onCancel,
}: {
  isOpen: boolean
  currentUrl: string
  onSave: (url: string) => void
  onCancel: () => void
}) => {
  const [url, setUrl] = useState(currentUrl)

  useEffect(() => {
    setUrl(currentUrl)
  }, [currentUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <h3 className="text-lg font-semibold mb-3">Adicionar Link</h3>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com"
          className="w-full p-2 border border-gray-300 rounded mb-3"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={() => onSave(url)}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

const FontSizePicker = ({
  selectedSize,
  onSizeChange,
  onClose,
}: {
  selectedSize: string
  onSizeChange: (size: string) => void
  onClose: () => void
}) => {
  const fontSizes = [
    { label: "8px", value: "8px" },
    { label: "10px", value: "10px" },
    { label: "12px", value: "12px" },
    { label: "14px", value: "14px" },
    { label: "16px", value: "16px" },
    { label: "18px", value: "18px" },
    { label: "20px", value: "20px" },
    { label: "24px", value: "24px" },
    { label: "28px", value: "28px" },
    { label: "32px", value: "32px" },
    { label: "36px", value: "36px" },
    { label: "48px", value: "48px" },
  ]

  return (
    <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-24">
      <div className="max-h-48 overflow-y-auto">
        {fontSizes.map((size) => (
          <button
            key={size.value}
            type="button"
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded ${
              selectedSize === size.value ? "bg-blue-100 text-blue-800" : ""
            }`}
            onClick={() => onSizeChange(size.value)}
            style={{ fontSize: size.value }}
          >
            {size.label}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-200 mt-2 pt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onSizeChange("")}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex-1"
        >
          Padrão
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex-1"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  className = "",
  noInternalScroll = false,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showFontSizePicker, setShowFontSizePicker] = useState(false)
  const [linkDialog, setLinkDialog] = useState({ isOpen: false, url: "" })

  const extensions = useMemo(
    () => [
      StarterKit,
      TextStyle,
      FontSize,
      Underline,
      Color.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800 cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    []
  )

  const editorProps = useMemo(
    () => ({
      attributes: {
        class: `focus:outline-none p-4 ${
          noInternalScroll ? "" : "min-h-[400px]"
        }`,
      },
    }),
    [noInternalScroll]
  )

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      const newContent = editor.getHTML()
      if (newContent !== content) {
        onChange(newContent)
      }
    },
    [onChange, content]
  )

  const editor = useEditor(
    {
      extensions,
      content,
      onUpdate: handleUpdate,
      editorProps,
    },
    []
  )

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const handleColorChange = useCallback(
    (color: string) => {
      if (editor) {
        if (color) {
          editor.chain().focus().setColor(color).run()
        } else {
          editor.chain().focus().unsetColor().run()
        }
      }
      setShowColorPicker(false)
    },
    [editor]
  )

  const handleHighlightChange = useCallback(
    (color: string) => {
      if (editor) {
        if (color && color !== "transparent") {
          editor.chain().focus().setHighlight({ color }).run()
        } else {
          editor.chain().focus().unsetHighlight().run()
        }
      }
      setShowHighlightPicker(false)
    },
    [editor]
  )

  const handleLinkSave = useCallback(
    (url: string) => {
      if (editor) {
        if (url) {
          editor.chain().focus().setLink({ href: url }).run()
        } else {
          editor.chain().focus().unsetLink().run()
        }
      }
      setLinkDialog({ isOpen: false, url: "" })
    },
    [editor]
  )

  const handleFontSizeChange = useCallback(
    (size: string) => {
      if (editor) {
        if (size) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(editor as any).chain().focus().setFontSize(size).run()
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(editor as any).chain().focus().unsetFontSize().run()
        }
      }
      setShowFontSizePicker(false)
    },
    [editor]
  )

  const openLinkDialog = useCallback(() => {
    const currentUrl = editor?.getAttributes("link").href || ""
    setLinkDialog({ isOpen: true, url: currentUrl })
  }, [editor])

  const ToolbarButton = useCallback(
    ({
      onClick,
      isActive = false,
      icon,
      title,
      children,
    }: {
      onClick: () => void
      isActive?: boolean
      icon?: string
      title: string
      children?: React.ReactNode
    }) => (
      <div className="relative">
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onClick}
          title={title}
          className="p-2"
        >
          {icon ? <Icon icon={icon} className="size-4" /> : children}
        </Button>
      </div>
    ),
    []
  )

  if (!editor) {
    return null
  }

  const currentTextColor = editor.getAttributes("textStyle").color || "#000000"
  const currentHighlightColor =
    editor.getAttributes("highlight").color || "#FFFF00"
  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px"

  return (
    <div
      className={`overflow-hidden rounded-[12px] border border-filete-forte bg-white ${className}`}
    >
      <div className="flex flex-wrap gap-1 border-b border-filete bg-papel p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          icon="mdi:format-bold"
          title="Negrito"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          icon="mdi:format-italic"
          title="Itálico"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          icon="mdi:format-underline"
          title="Sublinhado"
        />

        <div className="mx-1 h-6 w-px bg-filete-forte"></div>

        <div className="relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            isActive={
              showColorPicker || !!editor.getAttributes("textStyle").color
            }
            title="Cor do texto"
          >
            <div className="flex flex-col items-center">
              <Icon icon="mdi:format-color-text" className="size-3.5" />
              <div
                className="w-4 h-1 rounded-sm border border-gray-300"
                style={{ backgroundColor: currentTextColor }}
              />
            </div>
          </ToolbarButton>
          {showColorPicker && (
            <ColorPicker
              selectedColor={currentTextColor}
              onColorChange={handleColorChange}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>

        <div className="relative">
          <ToolbarButton
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            isActive={showHighlightPicker || editor.isActive("highlight")}
            title="Marca-texto"
          >
            <div className="flex flex-col items-center">
              <Icon icon="mdi:format-color-highlight" className="size-3.5" />
              <div
                className="w-4 h-1 rounded-sm border border-gray-300"
                style={{ backgroundColor: currentHighlightColor }}
              />
            </div>
          </ToolbarButton>
          {showHighlightPicker && (
            <HighlightColorPicker
              selectedColor={currentHighlightColor}
              onColorChange={handleHighlightChange}
              onClose={() => setShowHighlightPicker(false)}
            />
          )}
        </div>

        <div className="relative">
          <ToolbarButton
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            isActive={
              showFontSizePicker || !!editor.getAttributes("textStyle").fontSize
            }
            title="Tamanho da fonte"
          >
            <div className="flex items-center gap-1">
              <Icon icon="mdi:format-size" className="size-3.5" />
              <span className="text-xs font-mono min-w-6 text-center">
                {currentFontSize.replace("px", "")}
              </span>
            </div>
          </ToolbarButton>
          {showFontSizePicker && (
            <FontSizePicker
              selectedSize={currentFontSize}
              onSizeChange={handleFontSizeChange}
              onClose={() => setShowFontSizePicker(false)}
            />
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-filete-forte"></div>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          icon="mdi:format-header-1"
          title="Título 1"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          icon="mdi:format-header-2"
          title="Título 2"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          icon="mdi:format-header-3"
          title="Título 3"
        />

        <div className="mx-1 h-6 w-px bg-filete-forte"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          icon="mdi:format-list-bulleted"
          title="Lista com marcadores"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          icon="mdi:format-list-numbered"
          title="Lista numerada"
        />

        <div className="mx-1 h-6 w-px bg-filete-forte"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          icon="mdi:format-quote-close"
          title="Citação"
        />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon="mdi:minus"
          title="Linha horizontal"
        />

        <ToolbarButton
          onClick={openLinkDialog}
          isActive={editor.isActive("link")}
          icon="mdi:link"
          title="Link"
        />

        <div className="mx-1 h-6 w-px bg-filete-forte"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          icon="mdi:format-align-left"
          title="Alinhar à esquerda"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          icon="mdi:format-align-center"
          title="Centralizar"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          icon="mdi:format-align-right"
          title="Alinhar à direita"
        />

        <div className="mx-1 h-6 w-px bg-filete-forte"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon="mdi:undo"
          title="Desfazer"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon="mdi:redo"
          title="Refazer"
        />
      </div>

      <EditorContent
        editor={editor}
        className={`bg-white rounded-b-lg ${
          noInternalScroll ? "" : "min-h-[400px] max-h-[600px] overflow-y-auto"
        }`}
      />

      <LinkDialog
        isOpen={linkDialog.isOpen}
        currentUrl={linkDialog.url}
        onSave={handleLinkSave}
        onCancel={() => setLinkDialog({ isOpen: false, url: "" })}
      />
    </div>
  )
}
