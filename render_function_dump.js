function render(_ctx, _cache) {
  with (_ctx) {
    const { createElementVNode: _createElementVNode, openBlock: _openBlock, createElementBlock: _createElementBlock, toDisplayString: _toDisplayString, renderList: _renderList, Fragment: _Fragment, createCommentVNode: _createCommentVNode, normalizeClass: _normalizeClass, vModelText: _vModelText, withKeys: _withKeys, withDirectives: _withDirectives, withModifiers: _withModifiers } = _Vue

    return (_openBlock(), _createElementBlock("div", _hoisted_1, [(viewMode === 'library')
      ? (_openBlock(), _createElementBlock("div", _hoisted_2, [_createElementVNode("header", _hoisted_3, [_createElementVNode("div", _hoisted_4, [_cache[0] || (_cache[0] = _createElementVNode("div", { class: "flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 font-bold shrink-0" }, [_createElementVNode("svg", {
          class: "w-5 h-5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, [_createElementVNode("path", {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        })])], -1)), _createElementVNode("span", _hoisted_5, _toDisplayString(t('appName')), 1), _createElementVNode("nav", _hoisted_6, [(_openBlock(true), _createElementBlock(_Fragment, null, _renderList(breadcrumbs, (crumb, idx) => {
          return (_openBlock(), _createElementBlock(_Fragment, { key: idx }, [(idx > 0)
            ? (_openBlock(), _createElementBlock("span", _hoisted_7, "/"))
            : _createCommentVNode("", true), _createElementVNode("button", {
            onClick: $event => (navigateToCrumb(crumb)),
            class: _normalizeClass([idx === breadcrumbs.length - 1 ? 'text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-blue-400', "transition-colors truncate max-w-[120px] sm:max-w-[200px]"])
          }, _toDisplayString(crumb.name === '首页' ? t('home') : crumb.name), 11, _hoisted_8)], 64))
        }), 128))])]), _createElementVNode("div", _hoisted_9, [
          _createElementVNode("div", _hoisted_10, [_withDirectives(_createElementVNode("input", {
            "onUpdate:modelValue": $event => ((searchQuery) = $event),
            onKeyup: _withKeys(performGlobalSearch, ["enter"]),
            type: "text",
            placeholder: t('searchPlaceholder') + ' (Enter 搜索全局)',
            class: "w-full bg-zinc-900/80 border border-zinc-700/50 text-zinc-200 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-zinc-500"
          }, null, 40, _hoisted_11), [[_vModelText, searchQuery]]), _cache[1] || (_cache[1] = _createElementVNode("svg", {
            class: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, [_createElementVNode("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          })], -1))]),
          _createElementVNode("button", {
            onClick: toggleWeakNetworkMode,
            title: weakNetworkMode ? t('turboModeOn') : t('turboModeOff'),
            class: _normalizeClass([weakNetworkMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10' : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200', "flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-all select-none"])
          }, [(_openBlock(), _createElementBlock("svg", {
            class: _normalizeClass(["w-4 h-4", weakNetworkMode ? 'text-amber-400 animate-pulse' : 'text-zinc-400']),
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, [...(_cache[2] || (_cache[2] = [_createElementVNode("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M13 10V3L4 14h7v7l9-11h-7z"
          }, null, -1)]))], 2)), _createElementVNode("span", _hoisted_13, _toDisplayString(t('turboModeActive')) + ": " + _toDisplayString(weakNetworkMode ? 'ON' : 'OFF'), 1), _createElementVNode("span", { class: _normalizeClass([weakNetworkMode ? 'bg-amber-400 ring-2 ring-amber-400/40' : 'bg-zinc-600', "w-2 h-2 rounded-full transition-colors"]) }, null, 2)], 10, _hoisted_12),
          _createElementVNode("button", {
            onClick: $event => (showBookshelfModal = true),
            title: t('bookshelfManage'),
            class: "flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
          }, [_cache[3] || (_cache[3] = _createElementVNode("svg", {
            class: "w-4 h-4",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, [_createElementVNode("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M12 4v16m8-8H4"
          })], -1)), _createElementVNode("span", _hoisted_15, _toDisplayString(t('bookshelfManage')), 1)], 8, _hoisted_14),
          _createElementVNode("button", {
            onClick: $event => (showSettingsModal = true),
            title: t('settings'),
            class: "p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          }, [...(_cache[4] || (_cache[4] = [_createElementVNode("svg", {
            class: "w-5 h-5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, [_createElementVNode("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          }), _createElementVNode("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          })], -1)]))], 8, _hoisted_16),
          _createElementVNode("button", {
            onClick: $event => (showInfoModal = true),
            title: t('lanDevice'),
            class: "p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          }, [...(_cache[5] || (_cache[5] = [_createElementVNode("svg", {
            class: "w-5 h-5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, [_createElementVNode("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          })], -1)]))], 8, _hoisted_17)
        ])]), _createElementVNode("main", _hoisted_18, [loading
          ? (_openBlock(), _createElementBlock("div", _hoisted_19, [(_openBlock(true), _createElementBlock(_Fragment, null, _renderList(12, (n) => {
              return (_openBlock(), _createElementBlock("div", {
                key: n,
                class: "skeleton aspect-[3/4] rounded-xl"
              }))
            }), 128))]))
          : errorMsg
            ? (_openBlock(), _createElementBlock("div", _hoisted_20, [
                _cache[6] || (_cache[6] = _createElementVNode("div", { class: "w-16 h-16 rounded-full bg-red-900/20 text-red-400 flex items-center justify-center mb-4" }, [_createElementVNode("svg", {
                  class: "w-8 h-8",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [_createElementVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                })])], -1)),
                _createElementVNode("h3", _hoisted_21, _toDisplayString(t('errorTitle')), 1),
                _createElementVNode("p", _hoisted_22, _toDisplayString(errorMsg || t('errorDescFallback')), 1),
                _createElementVNode("div", _hoisted_23, [_createElementVNode("button", {
                  onClick: goBack,
                  class: "px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-medium transition-colors"
                }, _toDisplayString(t('backToLast')), 9, _hoisted_24), _createElementVNode("button", {
                  onClick: goHome,
                  class: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-colors"
                }, _toDisplayString(t('backToHome')), 9, _hoisted_25)])
              ]))
            : isRoot
              ? (_openBlock(), _createElementBlock("div", _hoisted_26, [_createElementVNode("div", _hoisted_27, [_createElementVNode("h2", _hoisted_28, [_createElementVNode("span", null, _toDisplayString(t('bookshelfCount')), 1), _createElementVNode("span", _hoisted_29, _toDisplayString(bookshelves.length), 1)])]), (bookshelves.length === 0)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_30, [
                      _cache[7] || (_cache[7] = _createElementVNode("div", { class: "w-16 h-16 mx-auto rounded-2xl bg-blue-900/20 text-blue-400 flex items-center justify-center mb-4" }, [_createElementVNode("svg", {
                        class: "w-8 h-8",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [_createElementVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      })])], -1)),
                      _createElementVNode("h3", _hoisted_31, _toDisplayString(t('noBookshelves')), 1),
                      _createElementVNode("p", _hoisted_32, _toDisplayString(t('noBookshelvesDesc')), 1),
                      _createElementVNode("button", {
                        onClick: $event => (showBookshelfModal = true),
                        class: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                      }, _toDisplayString(t('addBookshelfNow')), 9, _hoisted_33)
                    ]))
                  : (_openBlock(), _createElementBlock("div", _hoisted_34, [(_openBlock(true), _createElementBlock(_Fragment, null, _renderList(bookshelves, (shelf) => {
                      return (_openBlock(), _createElementBlock("div", {
                        key: shelf.id,
                        onClick: $event => (loadLibrary(shelf.encoded_path)),
                        class: "comic-card group relative bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer flex flex-col"
                      }, [_createElementVNode("div", _hoisted_36, [(shelf.cover_url)
                        ? (_openBlock(), _createElementBlock("img", {
                            key: 0,
                            src: shelf.cover_url,
                            alt: "",
                            loading: "lazy",
                            class: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          }, null, 8, _hoisted_37))
                        : (_openBlock(), _createElementBlock("div", _hoisted_38, [_cache[8] || (_cache[8] = _createElementVNode("svg", {
                            class: "w-12 h-12 mb-2 text-zinc-700",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [_createElementVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "1.5",
                            d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          })], -1)), _createElementVNode("span", _hoisted_39, _toDisplayString(t('folderBadge')), 1)])), _createElementVNode("div", _hoisted_40, _toDisplayString(t('bookshelfBadge')), 1)]), _createElementVNode("div", _hoisted_41, [_createElementVNode("div", null, [_createElementVNode("h4", {
                        class: "font-semibold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-1",
                        title: shelf.name
                      }, _toDisplayString(shelf.name), 9, _hoisted_42), _createElementVNode("p", {
                        class: "text-[11px] text-zinc-500 truncate mt-0.5",
                        title: shelf.path
                      }, _toDisplayString(shelf.path), 9, _hoisted_43)])])], 8, _hoisted_35))
                    }), 128))]))]))
              : (_openBlock(), _createElementBlock("div", _hoisted_44, [(filteredFolders.length > 0)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_45, [_createElementVNode("h3", _hoisted_46, [_cache[9] || (_cache[9] = _createElementVNode("svg", {
                      class: "w-4 h-4 text-zinc-500",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [_createElementVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    })], -1)), _createElementVNode("span", null, _toDisplayString(t('subFolders')) + " (" + _toDisplayString(filteredFolders.length) + ")", 1)]), _createElementVNode("div", _hoisted_47, [(_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filteredFolders, (folder) => {
                      return (_openBlock(), _createElementBlock("div", {
                        key: folder.id,
                        onClick: $event => (openFolder(folder)),
                        class: "comic-card group relative bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer flex flex-col"
                      }, [_createElementVNode("div", _hoisted_49, [(folder.cover_url)
                        ? (_openBlock(), _createElementBlock("img", {
                            key: 0,
                            src: folder.cover_url,
                            loading: "lazy",
                            alt: "",
                            class: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          }, null, 8, _hoisted_50))
                        : (_openBlock(), _createElementBlock("div", _hoisted_51, [_cache[10] || (_cache[10] = _createElementVNode("svg", {
                            class: "w-10 h-10 mb-2 text-zinc-600",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [_createElementVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "1.5",
                            d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          })], -1)), _createElementVNode("span", _hoisted_52, _toDisplayString(t('folderBadge')), 1)])), _createElementVNode("div", _hoisted_53, _toDisplayString(t('folderBadge')), 1)]), _createElementVNode("div", _hoisted_54, [_createElementVNode("h4", {
                        class: "font-medium text-xs text-zinc-200 group-hover:text-blue-400 transition-colors line-clamp-2",
                        title: folder.name
                      }, _toDisplayString(folder.name), 9, _hoisted_55)])], 8, _hoisted_48))
                    }), 128))])]))
                  : _createCommentVNode("", true), (filteredComics.length > 0)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_56, [_createElementVNode("h3", _hoisted_57, [_cache[11] || (_cache[11] = _createElementVNode("svg", {
                      class: "w-4 h-4 text-blue-400",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [_createElementVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    })], -1)), _createElementVNode("span", null, _toDisplayString(t('comicsSection')) + " (" + _toDisplayString(filteredComics.length) + ")", 1)]), _createElementVNode("div", _hoisted_58, [(_openBlock(true), _createElementBlock(_Fragment, null, _renderList(filteredComics, (comic) => {
                      return (_openBlock(), _createElementBlock("div", {
                        key: comic.id,
                        onClick: $event => (openComic(comic)),
                        class: "comic-card group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer flex flex-col"
                      }, [_createElementVNode("div", _hoisted_60, [
                        (comic.cover_url)
                          ? (_openBlock(), _createElementBlock("img", {
                              key: 0,
                              src: comic.cover_url,
                              loading: "lazy",
                              alt: "",
                              class: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            }, null, 8, _hoisted_61))
                          : (_openBlock(), _createElementBlock("div", _hoisted_62, [(comic.type === 'video')
                              ? (_openBlock(), _createElementBlock("svg", _hoisted_63, [...(_cache[12] || (_cache[12] = [_createElementVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "1.5",
                                  d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                }, null, -1), _createElementVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "1.5",
                                  d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                }, null, -1)]))]))
                              : (comic.type === 'book')
                                ? (_openBlock(), _createElementBlock("svg", _hoisted_64, [...(_cache[13] || (_cache[13] = [_createElementVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "1.5",
                                    d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  }, null, -1)]))]))
                                : (_openBlock(), _createElementBlock("svg", _hoisted_65, [...(_cache[14] || (_cache[14] = [_createElementVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "1.5",
                                    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  }, null, -1)]))])), _createElementVNode("span", _hoisted_66, _toDisplayString(t('noCover')), 1)])),
                        (comic.type === 'video')
                          ? (_openBlock(), _createElementBlock("div", _hoisted_67, [...(_cache[15] || (_cache[15] = [_createElementVNode("div", { class: "w-10 h-10 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" }, [_createElementVNode("svg", {
                              class: "w-5 h-5 ml-0.5",
                              fill: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [_createElementVNode("path", { d: "M8 5v14l11-7z" })])], -1)]))]))
                          : _createCommentVNode("", true),
                        _createElementVNode("button", {
                          onClick: _withModifiers($event => (downloadComic(comic)), ["stop"]),
                          title: `${t('downloadZipTitle')}: ${comic.name}`,
                          class: "absolute top-2 left-2 p-1.5 bg-black/75 hover:bg-blue-600 active:scale-90 text-zinc-300 hover:text-white backdrop-blur rounded-lg shadow-md transition-all duration-150 z-10"
                        }, [(!downloadingComics.has(comic.id))
                          ? (_openBlock(), _createElementBlock("svg", _hoisted_69, [...(_cache[16] || (_cache[16] = [_createElementVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            }, null, -1)]))]))
                          : (_openBlock(), _createElementBlock("svg", _hoisted_70, [...(_cache[17] || (_cache[17] = [_createElementVNode("circle", {
                              class: "opacity-25",
                              cx: "12",
                              cy: "12",
                              r: "10",
                              stroke: "currentColor",
                              "stroke-width": "4"
                            }, null, -1), _createElementVNode("path", {
                              class: "opacity-75",
                              fill: "currentColor",
                              d: "M4 12a8 8 0 018-8v8H4z"
                            }, null, -1)]))]))], 8, _hoisted_68),
                        _createElementVNode("div", _hoisted_71, _toDisplayString(comic.type === 'book' ? (comic.ext ? comic.ext.replace('.', '').toUpperCase() : t('bookBadge')) : (comic.type === 'video' ? t('videoBadge') : (comic.type === 'pdf' ? 'PDF' : (comic.type === 'archive' ? 'ZIP' : t('folderTypeBadge'))))), 1),
                        (comic.page_count && comic.type !== 'video' && comic.type !== 'book')
                          ? (_openBlock(), _createElementBlock("div", _hoisted_72, _toDisplayString(comic.page_count) + "P ", 1))
                          : _createCommentVNode("", true)
                      ]), _createElementVNode("div", _hoisted_73, [_createElementVNode("h4", {
                        class: "font-medium text-xs text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed",
                        title: comic.name
                      }, _toDisplayString(comic.name), 9, _hoisted_74)])], 8, _hoisted_59))
                    }), 128))])]))
                  : _createCommentVNode("", true), (filteredFolders.length === 0 && filteredComics.length === 0)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_75, [_cache[18] || (_cache[18] = _createElementVNode("svg", {
                      class: "w-12 h-12 mx-auto mb-3 text-zinc-700",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [_createElementVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "1.5",
                      d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    })], -1)), _createElementVNode("p", _hoisted_76, _toDisplayString(t('emptyDir')), 1)]))
                  : _createCommentVNode("", true)]))])]))
      : _createCommentVNode("", true)]))
  }
}