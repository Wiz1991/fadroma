(function() {var implementors = {};
implementors["fadroma_composability"] = [{"text":"impl <a class=\"trait\" href=\"secret_cosmwasm_std/traits/trait.Storage.html\" title=\"trait secret_cosmwasm_std::traits::Storage\">Storage</a> for <a class=\"struct\" href=\"fadroma_composability/composable_test/struct.ClonableMemoryStorage.html\" title=\"struct fadroma_composability::composable_test::ClonableMemoryStorage\">ClonableMemoryStorage</a>","synthetic":false,"types":["fadroma_composability::composable_test::ClonableMemoryStorage"]}];
implementors["secret_cosmwasm_storage"] = [{"text":"impl&lt;'a, T:&nbsp;<a class=\"trait\" href=\"secret_cosmwasm_std/traits/trait.Storage.html\" title=\"trait secret_cosmwasm_std::traits::Storage\">Storage</a>&gt; <a class=\"trait\" href=\"secret_cosmwasm_std/traits/trait.Storage.html\" title=\"trait secret_cosmwasm_std::traits::Storage\">Storage</a> for <a class=\"struct\" href=\"secret_cosmwasm_storage/struct.PrefixedStorage.html\" title=\"struct secret_cosmwasm_storage::PrefixedStorage\">PrefixedStorage</a>&lt;'a, T&gt;","synthetic":false,"types":["secret_cosmwasm_storage::prefixed_storage::PrefixedStorage"]},{"text":"impl&lt;'a, S:&nbsp;<a class=\"trait\" href=\"secret_cosmwasm_std/traits/trait.ReadonlyStorage.html\" title=\"trait secret_cosmwasm_std::traits::ReadonlyStorage\">ReadonlyStorage</a>&gt; <a class=\"trait\" href=\"secret_cosmwasm_std/traits/trait.Storage.html\" title=\"trait secret_cosmwasm_std::traits::Storage\">Storage</a> for <a class=\"struct\" href=\"secret_cosmwasm_storage/struct.StorageTransaction.html\" title=\"struct secret_cosmwasm_storage::StorageTransaction\">StorageTransaction</a>&lt;'a, S&gt;","synthetic":false,"types":["secret_cosmwasm_storage::transactions::StorageTransaction"]}];
if (window.register_implementors) {window.register_implementors(implementors);} else {window.pending_implementors = implementors;}})()