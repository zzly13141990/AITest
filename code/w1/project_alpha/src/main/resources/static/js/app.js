/**
 * 前端应用主脚本
 * 处理Ticket的增删改查、标签管理、分页等功能
 */
(function () {
  // DOM元素引用
  const tbody = document.getElementById("ticket-rows"); // Ticket列表表格体
  const inputQ = document.getElementById("filter-q"); // 搜索输入框
  const selectStatus = document.getElementById("filter-status"); // 状态筛选下拉框
  const selectTags = document.getElementById("filter-tags"); // 标签筛选下拉框
  const toastEl = document.getElementById("live-toast"); // 提示框元素
  const toast = toastEl ? new bootstrap.Toast(toastEl) : null; // 提示框实例
  const totalCountEl = document.getElementById("total-count"); // 总记录数显示
  const pageInfoEl = document.getElementById("page-info"); // 分页信息显示
  const btnPrev = document.getElementById("btn-prev"); // 上一页按钮
  const btnNext = document.getElementById("btn-next"); // 下一页按钮
  const pageInput = document.getElementById("page-input"); // 页码输入框
  const btnGo = document.getElementById("btn-go"); // 跳转按钮

  // Ticket模态框相关元素
  const modalTicketEl = document.getElementById("modal-ticket"); // Ticket模态框元素
  const modalTicket = new bootstrap.Modal(modalTicketEl); // Ticket模态框实例
  const formTicket = document.getElementById("form-ticket"); // Ticket表单
  const ticketModalTitle = document.getElementById("ticket-modal-title"); // 模态框标题
  const fieldId = document.getElementById("ticket-id"); // Ticket ID字段
  const fieldTitle = document.getElementById("ticket-title"); // 标题字段
  const fieldDesc = document.getElementById("ticket-description"); // 描述字段
  const fieldCompleted = document.getElementById("ticket-completed"); // 完成状态字段
  const rowCompleted = document.getElementById("row-completed"); // 完成状态行

  // 标签模态框相关元素
  const modalTagEl = document.getElementById("modal-add-tag"); // 标签模态框元素
  const modalTag = new bootstrap.Modal(modalTagEl); // 标签模态框实例
  const selectExistingTag = document.getElementById("select-existing-tag"); // 已有标签选择
  const inputNewTag = document.getElementById("new-tag-name"); // 新标签输入
  let addTagTicketId = null; // 当前操作的Ticket ID
  
  // 分页相关变量
  let currentPage = 1; // 当前页码
  const pageSize = 10; // 每页记录数
  let totalCount = 0; // 总记录数
  
  // 排序相关变量
  let sortField = ''; // 当前排序字段
  let sortDirection = 'asc'; // 当前排序方向 (asc 或 desc)

  /**
   * 显示提示消息
   * @param {string} message 消息内容
   * @param {boolean} isError 是否为错误消息
   */
  function showToast(message, isError) {
    if (!toastEl) {
      alert(message);
      return;
    }
    toastEl.querySelector(".toast-body").textContent = message;
    toastEl.classList.toggle("text-bg-danger", !!isError);
    toastEl.classList.toggle("text-bg-success", !isError);
    toast.show();
  }

  /**
   * 加载标签筛选选项
   */
  async function loadTagFilters() {
    const tags = await Api.json("/api/tags");
    selectTags.innerHTML = "";
    tags.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      selectTags.appendChild(opt);
    });
  }

  /**
   * 获取选中的标签ID列表
   * @returns {Array<number>} 标签ID列表
   */
  function selectedTagIds() {
    return [...selectTags.selectedOptions].map((opt) => Number(opt.value));
  }

  /**
   * 生成Ticket查询路径
   * @returns {string} 查询路径
   */
  function ticketsQueryPath() {
    const params = new URLSearchParams();
    selectedTagIds().forEach((id) => params.append("tagIds", id));
    const q = inputQ.value.trim();
    if (q) params.set("q", q);
    const status = selectStatus.value;
    if (status !== "") params.set("completed", status);
    params.set("page", currentPage - 1); // 后端使用0-based页码
    params.set("size", pageSize);
    // 添加排序参数
    if (sortField) {
      params.set("sort", `${sortField},${sortDirection}`);
    }
    const qs = params.toString();
    return qs ? "/api/tickets?" + qs : "/api/tickets";
  }

  /**
   * 转义HTML特殊字符
   * @param {string} s 原始字符串
   * @returns {string} 转义后的字符串
   */
  function escapeHtml(s) {
    if (!s) return "";
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * 渲染Ticket列表
   * @param {Object} data 分页数据
   */
  function renderTickets(data) {
    const rows = data.content || [];
    totalCount = data.totalElements || 0;
    
    tbody.innerHTML = "";
    rows.forEach((t) => {
      const tr = document.createElement("tr");
      if (t.completed) tr.classList.add("table-secondary");
      const tagBadges = (t.tags || [])
        .map(
          (g) =>
            `<span class="badge badge-secondary me-1">${escapeHtml(g.name)}
            <button type="button" class="btn-close btn-close-white btn-sm ms-1" style="font-size:0.5rem" data-rm-tag="${g.id}" data-ticket="${t.id}" aria-label="remove"></button></span>`
        )
        .join("");
      tr.innerHTML = `
        <td class="${t.completed ? "text-decoration-line-through" : ""}">${escapeHtml(t.title)}</td>
        <td>
          <div class="tag-container">
            ${tagBadges || '<span class="text-muted">—</span>'}
          </div>
        </td>
        <td>${t.completed ? '<span class="badge badge-success">已完成</span>' : '<span class="badge badge-secondary">未完成</span>'}</td>
        <td>
          <div class="action-buttons">
            <button type="button" class="btn btn-outline-primary" data-id="${t.id}" data-done="${t.completed}">
              ${t.completed ? "取消完成" : "完成"}
            </button>
            <button type="button" class="btn btn-secondary" data-id="${t.id}">标签</button>
            <button type="button" class="btn btn-secondary" data-id="${t.id}">编辑</button>
            <button type="button" class="btn btn-outline-danger" data-id="${t.id}">删除</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    // 更新分页信息
    totalCountEl.textContent = totalCount;
    const totalPages = data.totalPages || 1;
    pageInfoEl.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    pageInput.value = currentPage;
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage >= totalPages;

    // 添加按钮事件监听
    tbody.querySelectorAll(".btn").forEach((btn) => {
      if (btn.classList.contains("btn-outline-danger")) {
        btn.addEventListener("click", () => deleteTicket(btn.dataset.id));
      } else if (btn.classList.contains("btn-outline-primary")) {
        btn.addEventListener("click", () => toggleDone(btn.dataset.id, btn.dataset.done === "true"));
      } else if (btn.classList.contains("btn-secondary")) {
        if (btn.textContent.trim() === "编辑") {
          btn.addEventListener("click", () => openEditTicket(btn.dataset.id));
        } else if (btn.textContent.trim() === "标签") {
          btn.addEventListener("click", () => openAddTagModal(btn.dataset.id));
        }
      }
    });
    // 添加标签移除事件监听
    tbody.querySelectorAll("[data-rm-tag]").forEach((btn) =>
      btn.addEventListener("click", () => removeTag(btn.dataset.ticket, btn.dataset.rmTag))
    );
  }

  /**
   * 刷新Ticket列表
   */
  async function refreshTickets() {
    try {
      const data = await Api.json(ticketsQueryPath());
      renderTickets(data);
    } catch (e) {
      showToast(e.message, true);
    }
  }

  /**
   * 删除Ticket
   * @param {string} id Ticket ID
   */
  async function deleteTicket(id) {
    if (!confirm("确定删除该 Ticket？")) return;
    try {
      await Api.json("/api/tickets/" + id, { method: "DELETE" });
      showToast("已删除");
      await refreshTickets();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  /**
   * 切换Ticket完成状态
   * @param {string} id Ticket ID
   * @param {boolean} currentlyDone 当前完成状态
   */
  async function toggleDone(id, currentlyDone) {
    try {
      const path = currentlyDone ? `/api/tickets/${id}/incomplete` : `/api/tickets/${id}/complete`;
      await Api.json(path, { method: "PATCH" });
      showToast(currentlyDone ? "已标记为未完成" : "已标记为完成");
      await refreshTickets();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  /**
   * 打开新建Ticket模态框
   */
  function openNewTicket() {
    ticketModalTitle.textContent = "新建 Ticket";
    fieldId.value = "";
    fieldTitle.value = "";
    fieldDesc.value = "";
    fieldCompleted.checked = false;
    rowCompleted.style.display = "none";
    modalTicket.show();
  }

  /**
   * 打开编辑Ticket模态框
   * @param {string} id Ticket ID
   */
  async function openEditTicket(id) {
    try {
      const t = await Api.json("/api/tickets/" + id);
      ticketModalTitle.textContent = "编辑 Ticket";
      fieldId.value = t.id;
      fieldTitle.value = t.title;
      fieldDesc.value = t.description || "";
      fieldCompleted.checked = t.completed;
      rowCompleted.style.display = "flex";
      modalTicket.show();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  /**
   * 处理Ticket表单提交
   */
  formTicket.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const id = fieldId.value;
    const payload = {
      title: fieldTitle.value.trim(),
      description: fieldDesc.value || null,
    };
    try {
      if (!id) {
        // 新建Ticket
        await Api.json("/api/tickets", { method: "POST", body: JSON.stringify(payload) });
        showToast("已创建");
      } else {
        // 更新Ticket
        payload.completed = fieldCompleted.checked;
        await Api.json("/api/tickets/" + id, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("已保存");
      }
      modalTicket.hide();
      await refreshTickets();
    } catch (e) {
      showToast(e.message, true);
    }
  });

  /**
   * 打开添加标签模态框
   * @param {string} ticketId Ticket ID
   */
  async function openAddTagModal(ticketId) {
    addTagTicketId = ticketId;
    selectExistingTag.innerHTML = '<option value="">— 选择已有标签 —</option>';
    inputNewTag.value = "";
    try {
      const tags = await Api.json("/api/tags");
      tags.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.name;
        selectExistingTag.appendChild(opt);
      });
      modalTag.show();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  /**
   * 处理添加标签提交
   */
  document.getElementById("btn-submit-add-tag").addEventListener("click", async () => {
    const tid = addTagTicketId;
    const sel = selectExistingTag.value;
    const name = inputNewTag.value.trim();
    let body;
    if (sel) {
      // 使用已有标签
      body = JSON.stringify({ tagId: Number(sel) });
    } else if (name) {
      // 创建新标签
      body = JSON.stringify({ tagName: name });
    } else {
      showToast("请选择标签或输入新标签名", true);
      return;
    }
    try {
      await Api.json("/api/tickets/" + tid + "/tags", { method: "POST", body });
      showToast("标签已更新");
      modalTag.hide();
      await refreshTickets();
      await loadTagFilters();
    } catch (e) {
      showToast(e.message, true);
    }
  });

  /**
   * 移除标签
   * @param {string} ticketId Ticket ID
   * @param {string} tagId 标签ID
   */
  async function removeTag(ticketId, tagId) {
    try {
      await Api.json("/api/tickets/" + ticketId + "/tags/" + tagId, { method: "DELETE" });
      showToast("已移除标签");
      await refreshTickets();
    } catch (e) {
      showToast(e.message, true);
    }
  }

  // 事件监听器
  document.getElementById("btn-refresh").addEventListener("click", refreshTickets);
  document.getElementById("btn-new-ticket").addEventListener("click", openNewTicket);
  inputQ.addEventListener("keydown", (e) => {
    if (e.key === "Enter") refreshTickets();
  });
  selectStatus.addEventListener("change", refreshTickets);
  selectTags.addEventListener("change", refreshTickets);
  
  // 分页按钮事件
  btnPrev.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      refreshTickets();
    }
  });
  
  btnNext.addEventListener("click", () => {
    currentPage++;
    refreshTickets();
  });

  // 页码跳转事件
  btnGo.addEventListener("click", () => {
    const page = parseInt(pageInput.value);
    if (page && page > 0) {
      currentPage = page;
      refreshTickets();
    }
  });

  // 页码输入框回车事件
  pageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput.value);
      if (page && page > 0) {
        currentPage = page;
        refreshTickets();
      }
    }
  });

  /**
   * 处理表头排序点击
   * @param {string} field 排序字段
   */
  function handleSortClick(field) {
    // 重置页码到第一页
    currentPage = 1;
    pageInput.value = 1;
    
    // 如果点击的是当前排序字段，则切换排序方向
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // 否则设置新的排序字段和默认方向
      sortField = field;
      sortDirection = 'asc';
    }
    
    // 更新表头排序状态
    document.querySelectorAll('.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    if (sortField) {
      const sortableTh = document.querySelector(`.sortable[data-sort="${sortField}"]`);
      if (sortableTh) {
        sortableTh.classList.add(`sort-${sortDirection}`);
      }
    }
    
    // 刷新列表
    refreshTickets();
  }

  // 初始化加载
  loadTagFilters().then(refreshTickets).catch((e) => showToast(e.message, true));
  
  // 添加排序事件监听
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (field) {
        handleSortClick(field);
      }
    });
  });
})();
