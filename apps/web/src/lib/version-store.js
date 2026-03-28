function findVersion(versions, versionId) {
  return versions.find((version) => version.id === versionId) ?? null;
}

function defaultSelectedVersionId(serverState) {
  return serverState.versions[0]?.id ?? "";
}

export function hydrateVersionState(serverState, currentState = null, options = {}) {
  const versions = serverState?.versions ?? [];
  const requestedSelectedVersionId =
    options.selectedVersionId ??
    currentState?.selectedVersionId ??
    defaultSelectedVersionId(serverState);
  const nextSelectedVersion =
    findVersion(versions, requestedSelectedVersionId) ??
    versions[0] ??
    null;

  if (!nextSelectedVersion) {
    return {
      selectedVersionId: "",
      workingMarkdown: "",
      versions: [],
    };
  }

  if (!currentState) {
    return {
      selectedVersionId: nextSelectedVersion.id,
      workingMarkdown: nextSelectedVersion.markdown,
      versions,
    };
  }

  const previousSelectedVersion = findVersion(currentState.versions, currentState.selectedVersionId);
  const isDirty = Boolean(
    previousSelectedVersion &&
      currentState.workingMarkdown !== previousSelectedVersion.markdown,
  );

  const shouldRefreshWorkingMarkdown =
    options.forceWorkingMarkdown === true ||
    nextSelectedVersion.id !== currentState.selectedVersionId ||
    !isDirty;

  return {
    selectedVersionId: nextSelectedVersion.id,
    workingMarkdown: shouldRefreshWorkingMarkdown
      ? nextSelectedVersion.markdown
      : currentState.workingMarkdown,
    versions,
  };
}

export function updateWorkingMarkdown(state, markdown) {
  return {
    ...state,
    workingMarkdown: markdown,
  };
}

export function selectVersion(state, versionId) {
  const selectedVersion = findVersion(state.versions, versionId);
  if (!selectedVersion) {
    return state;
  }

  return {
    ...state,
    selectedVersionId: selectedVersion.id,
    workingMarkdown: selectedVersion.markdown,
  };
}

export function restoreSelectedVersion(state) {
  const selectedVersion = findVersion(state.versions, state.selectedVersionId);
  if (!selectedVersion) {
    return state;
  }

  return {
    ...state,
    workingMarkdown: selectedVersion.markdown,
  };
}
