call plug#begin('~/.vim/plugged')

" Declare the list of plugins.
Plug 'tpope/vim-sensible'
Plug 'junegunn/seoul256.vim'
Plug 'tmhedberg/SimpylFold'
Plug 'vim-scripts/indentpython.vim'
Plug 'Valloric/YouCompleteMe' 
Plug 'vim-syntastic/syntastic'
Plug 'nvie/vim-flake8'
Plug 'jnurmine/Zenburn'
Plug 'scrooloose/nerdtree'
Plug 'tpope/vim-fugitive'
Plug 'itchyny/lightline.vim'
Plug 'pangloss/vim-javascript'
Plug 'mxw/vim-jsx'
Plug 'leshill/vim-json'
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'
Plug 'SirVer/ultisnips'
Plug 'w0rp/ale'
Plug 'editorconfig/editorconfig-vim'
Plug 'tpope/vim-eunuch'
Plug 'tpope/vim-surround'
Plug 'airblade/vim-gitgutter'
" List ends here. Plugins become visible to Vim after this call.
call plug#end()

set splitbelow
set splitright

"split navigations
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>

map <C-o> :NERDTreeToggle<CR>

" Enable folding
set foldmethod=indent
set foldlevel=99

" Enable folding with the spacebar
nnoremap <space> za

nnoremap <C-p> :Files<Cr>

au BufNewFile,BufRead *.py
    \ set tabstop=4 |
    \ set softtabstop=4 |
    \ set shiftwidth=4 |
    \ set textwidth=79 |
    \ set expandtab |
    \ set autoindent |
    \ set fileformat=unix |

highlight BadWhitespace ctermbg=red guibg=red

au BufRead,BufNewFile *.py,*.pyw,*.c,*.h match BadWhitespace /\s\+$/

set encoding=utf-8

let python_highlight_all=1
let g:ale_lint_on_save = 1
let g:ale_lint_on_text_changed = 0
syntax on

colorscheme zenburn

let NERDTreeIgnore=['\.pyc$', '\~$'] "ignore files in NERDTree

set nu
set noshowmode

let g:lightline = {
      \ 'active': {
      \   'left': [ [ 'mode', 'paste' ],
      \             [ 'gitbranch', 'readonly', 'filename', 'modified' ] ]
      \ },
      \ 'component_function': {
      \   'gitbranch': 'fugitive#head'
      \ },
      \ }

set clipboard=unnamed
let g:javascript_plugin_flow = 1
let g:jsx_ext_required = 0

augroup javascript_folding
  au!
  au FileType javascript setlocal foldmethod=syntax
augroup END

