-- Point language server for Neovim 0.11+
-- Copy to ~/.config/nvim/lua/point.lua and require from init.lua:
--   require("point")
--
-- Or symlink from this repo:
--   ln -s /path/to/point/editors/neovim/point.lua ~/.config/nvim/lua/point.lua

vim.filetype.add({
  extension = {
    point = "point",
  },
})

if not vim.lsp.config then
  vim.notify("Point: Neovim 0.11+ with vim.lsp.config is required", vim.log.levels.WARN)
  return
end

vim.lsp.config("point", {
  cmd = { "point", "lsp" },
  filetypes = { "point" },
  root_markers = { "point.json", ".git" },
  settings = {},
})

vim.lsp.enable("point")

-- Optional: format on save
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*.point",
  callback = function(event)
    vim.lsp.buf.format({ bufnr = event.buf, timeout_ms = 3000, async_ = false })
  end,
})

return {}
